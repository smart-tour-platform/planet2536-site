const { test } = require('node:test');
const assert = require('node:assert/strict');
const { catalog } = require('../netlify/lib/catalog.cjs');
const { SESSIONS } = require('../assets/data.js');
const { validateProduct, service, unseal } = require('../netlify/lib/payment.cjs');
const POLICY = require('../assets/policy.js');
const at = Date.parse('2026-10-14T17:00:00+09:00');
const env = { PAYMENTS_ENABLED:'true',TOSS_MODE:'test',TOSS_CLIENT_KEY:'test_ck_shop',TOSS_SECRET_KEY:'test_sk_shop',TOSS_MID:'spacew90od',TOSS_TAX_MODE:'taxable',ORDER_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64') };
test('submitted products reproduce expiry; live catalog keeps every original deadline', () => {
  assert.deepEqual(catalog('live',at).products, SESSIONS);
  for (const p of SESSIONS) assert.throws(() => validateProduct(p,at), /신청 기간/);
});
test('test catalog remains valid across year and leap-day boundaries without mutating real products', () => {
  const original = JSON.stringify(SESSIONS);
  for (const now of [at, Date.parse('2026-12-31T23:59:59+09:00'), Date.parse('2028-02-29T00:00:00+09:00')]) {
    const c = catalog('test',now);
    assert.match(c.reviewNotice,/실제 모임 예약이나 금액 청구가 발생하지 않습니다/);
    c.products.forEach((p,i) => {
      validateProduct(p,now); assert.equal(p.price,SESSIONS[i].price);
      assert.equal(p.meetings.length,SESSIONS[i].meetings.length);
      assert.equal(new Date(p.meetings[0].startAt).getUTCDay(),new Date(SESSIONS[i].meetings[0].startAt).getUTCDay());
      assert.equal(p.reviewSample,true);
    });
  }
  assert.equal(JSON.stringify(SESSIONS),original);
});
test('test orders require displayed catalog version and freeze the displayed schedule', async () => {
  const c = catalog('test',at), saved = new Map();
  const api = service({env,now:()=>at,store:{setJSON:async(id,data)=>{saved.set(id,data);return {modified:true};}}});
  for (const product of c.products) {
    const input={productId:product.id,name:'Test',phone:'01000000000',policyVersion:POLICY.version,agreements:{refund:true,privacy:true,terms:true,once:true}};
    await assert.rejects(api.create(input),/갱신/);
    await assert.rejects(api.create({...input,catalogVersion:'stale'}),/갱신/);
    const order=await api.create({...input,catalogVersion:c.catalogVersion,amount:1});
    assert.equal(order.amount,product.price); assert.deepEqual(order.meetings,product.meetings);
    assert.deepEqual(unseal(saved.get(order.orderId),env.ORDER_ENCRYPTION_KEY).product,product);
  }
  assert.equal(saved.size,3);
});
test('client cannot enable review samples for live orders', async () => {
  const api=service({env:{...env,TOSS_MODE:'live',TOSS_CLIENT_KEY:'live_ck_shop',TOSS_SECRET_KEY:'live_sk_shop'},now:()=>at,store:{setJSON:()=>assert.fail('must not store expired live order')}});
  await assert.rejects(api.create({productId:'running',reviewSample:true,catalogVersion:catalog('test',at).catalogVersion}),/신청 기간/);
});
