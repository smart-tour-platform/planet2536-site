const { randomUUID, randomBytes, createCipheriv, createDecipheriv, createHash } = require('node:crypto');
const { SESSIONS, SALE_LIMITS } = require('../../assets/data.js');
const POLICY = require('../../assets/policy.js');
const DAY = 86400000;
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function config(env) {
  if (env.PAYMENTS_ENABLED !== 'true' || !/^test_gck_/.test(env.TOSS_CLIENT_KEY || '') ||
      !/^test_gsk_/.test(env.TOSS_SECRET_KEY || '') || /docs|REPLACE/.test(env.TOSS_CLIENT_KEY + env.TOSS_SECRET_KEY) ||
      env.TOSS_MID !== 'spacew90od' || Buffer.from(env.ORDER_ENCRYPTION_KEY || '', 'base64').length !== 32)
    fail('결제 준비 중입니다. 고객센터로 문의해 주세요.', 503);
}
function validateProduct(s, now, policy = POLICY) {
  if (!s || s.saleStatus !== 'open' || !s.hostVerified || !s.placeVerified ||
      !s.taxVerified || !['taxable', 'exempt'].includes(s.taxType) || !s.included?.length || !s.extraCosts ||
      !policy.reviewed || !Number.isFinite(Date.parse(policy.effectiveAt)) || Date.parse(policy.effectiveAt) > now)
    fail('상품 및 정책 확인 후 신청이 가능합니다.', 409);
  if (!Number.isSafeInteger(s.price) || s.price < 1000 || s.meetings.length !== 1)
    fail('현재 웹 결제는 확정된 단발형 상품만 지원합니다.', 409);
  if (s.price > SALE_LIMITS.maxPaymentAmount)
    fail('단발형 또는 차수 전체의 결제금액은 990,000원을 초과할 수 없습니다.', 409);
  const { startAt, endAt } = s.meetings[0];
  const start = Date.parse(startAt), end = Date.parse(endAt), deadline = Date.parse(s.deadlineAt);
  if (![start, end, deadline].every(Number.isFinite) || end <= start || deadline > start - DAY ||
      now >= deadline || now < start - 28 * DAY || end > now + 70 * DAY)
    fail('신청 기간 또는 제공 일정이 유효하지 않습니다.', 409);
}
function seal(value, key) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') };
}
function unseal(value, key) {
  const cipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64'), Buffer.from(value.iv, 'base64'));
  cipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.data, 'base64')), cipher.final()]).toString());
}
const hash = value => createHash('sha256').update(value).digest('hex');
const publicOrder = o => ({ orderId: o.orderId, title: o.product.title, amount: o.amount,
  taxFreeAmount: o.product.taxType === 'exempt' ? o.amount : 0,
  meetings: o.product.meetings, host: o.product.host, place: o.product.place,
  purchaseScope: o.product.purchaseScope, policyVersion: o.policy.version,
  status: o.status, approvedAt: o.approvedAt, method: o.method });
function service({ store, env, fetcher = fetch, now = Date.now, products = SESSIONS, policy = POLICY }) {
  const read = async id => {
    const blob = await store.getWithMetadata(id, { type: 'json' });
    return blob && { order: unseal(blob.data, env.ORDER_ENCRYPTION_KEY), etag: blob.etag };
  };
  const write = (o, opts) => store.setJSON(o.orderId, seal(o, env.ORDER_ENCRYPTION_KEY), opts);
  async function toss(path, body, id) {
    const response = await fetcher('https://api.tosspayments.com/v1/payments' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: 'Basic ' + Buffer.from(env.TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json', ...(body ? { 'Idempotency-Key': id } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000)
    });
    const result = await response.json();
    return { ok: response.ok, result };
  }
  return {
    async create(input) {
      config(env);
      const product = products.find(s => s.id === input.productId);
      validateProduct(product, now(), policy);
      if (!['taxable', 'exempt', 'mixed'].includes(env.TOSS_TAX_MODE) ||
          (env.TOSS_TAX_MODE !== 'mixed' && env.TOSS_TAX_MODE !== product.taxType))
        fail('상점의 과세 설정 확인 후 결제가 가능합니다.', 503);
      if (input.policyVersion !== policy.version || input.agreements?.refund !== true ||
          input.agreements?.once !== true || input.agreements?.privacy !== true || input.agreements?.terms !== true)
        fail('최신 정책과 필수 항목에 동의해 주세요.');
      const name = String(input.name || '').trim(), phone = String(input.phone || '').replace(/[-\s]/g, ''), email = String(input.email || '').trim();
      if (!name || name.length > 60 || !/^01[016789]\d{7,8}$/.test(phone) ||
          email.length > 100 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fail('신청자 정보를 확인해 주세요.');
      const token = randomBytes(32).toString('hex');
      const order = { orderId: 'pp_' + randomUUID(), amount: product.price, product: structuredClone(product),
        applicant: { name, phone, ...(email ? { email } : {}) }, policy: structuredClone(policy),
        agreements: input.agreements, consentAt: new Date(now()).toISOString(),
        expiresAt: now() + 30 * 60000, tokenHash: hash(token), status: 'READY' };
      await write(order, { onlyIfNew: true });
      return { ...publicOrder(order), token };
    },
    async confirm(input) {
      config(env);
      if (!/^pp_[a-f0-9-]{36}$/.test(input.orderId || '') || typeof input.paymentKey !== 'string' ||
          !input.paymentKey || input.paymentKey.length > 200 || typeof input.token !== 'string') fail('잘못된 결제 접근입니다.');
      let entry = await read(input.orderId);
      if (!entry || hash(input.token) !== entry.order.tokenHash) fail('주문을 확인할 수 없습니다.', 403);
      let o = entry.order;
      if (!Number.isSafeInteger(input.amount) || input.amount !== o.amount) fail('주문 금액이 일치하지 않습니다.');
      if (o.paymentKey && o.paymentKey !== input.paymentKey) fail('다른 결제 정보가 연결된 주문입니다.', 409);
      if (o.status === 'DONE') return publicOrder(o);
      // Bind a single payment key atomically. Retries reconcile this same key even after expiry.
      if (!o.paymentKey) {
        if (now() >= o.expiresAt) fail('주문 유효시간이 지났습니다. 다시 신청해 주세요.', 409);
        validateProduct(o.product, now(), o.policy);
        o.paymentKey = input.paymentKey;
        o.status = 'CONFIRMING';
        const saved = await write(o, { onlyIfMatch: entry.etag });
        if (!saved.modified) fail('다른 요청을 확인 중입니다. 잠시 후 다시 확인해 주세요.', 409);
        entry.etag = saved.etag;
      }
      let payment;
      try {
        const lookup = await toss('/' + encodeURIComponent(o.paymentKey));
        if (lookup.ok && lookup.result.status !== 'READY' && lookup.result.status !== 'IN_PROGRESS') payment = lookup.result;
        else {
          // Expired READY orders must never receive a new approval; completed payments above still reconcile.
          if (now() >= o.expiresAt) fail('주문이 만료되었습니다. 고객센터에 결제 상태를 확인해 주세요.', 409);
          validateProduct(o.product, now(), o.policy);
          if (!lookup.ok && lookup.result.code !== 'NOT_FOUND_PAYMENT') fail('결제 상태 조회에 실패했습니다. 다시 확인해 주세요.', 502);
          const confirmed = await toss('/confirm', { paymentKey: o.paymentKey, orderId: o.orderId, amount: o.amount }, o.orderId);
          if (!confirmed.ok) fail('결제 승인을 확인하지 못했습니다. 다시 확인하거나 고객센터로 문의해 주세요.', 502);
          payment = confirmed.result;
        }
      } catch (e) {
        if (e.status) throw e;
        fail('결제 상태 확인이 지연되고 있습니다. 다시 결제하지 말고 아래 재확인을 이용해 주세요.', 502);
      }
      if (payment.orderId !== o.orderId || payment.totalAmount !== o.amount || payment.paymentKey !== o.paymentKey ||
          payment.mid !== env.TOSS_MID || payment.currency !== 'KRW') fail('승인 정보 검증에 실패했습니다. 고객센터로 문의해 주세요.', 502);
      if (payment.status !== 'DONE') fail('결제가 완료되지 않았습니다. 입금 대기·취소 등 결제 상태를 고객센터에 확인해 주세요.', 409);
      o.status = 'DONE'; o.approvedAt = payment.approvedAt; o.method = payment.method;
      const saved = await write(o, { onlyIfMatch: entry.etag });
      if (!saved.modified) {
        const latest = await read(o.orderId);
        if (latest?.order.status !== 'DONE') fail('승인 결과 저장을 재확인해 주세요.', 503);
        o = latest.order;
      }
      return publicOrder(o);
    }
  };
}
module.exports = { service, config, validateProduct, seal, unseal };
