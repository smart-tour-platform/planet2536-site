import { getStore } from '@netlify/blobs';
import payment from '../lib/payment.cjs';
import policy from '../../assets/policy.js';
export default async function handler(request) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  try {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      payment.config(process.env);
      if (!policy.reviewed || !policy.effectiveAt) return json({ message: '상품 및 정책 확인 후 결제가 가능합니다.' }, 503);
      return json({ clientKey: process.env.TOSS_CLIENT_KEY, policyVersion: policy.version,
        paymentVariant: process.env.TOSS_PAYMENT_VARIANT || 'DEFAULT', agreementVariant: process.env.TOSS_AGREEMENT_VARIANT || 'AGREEMENT' });
    }
    if (request.method !== 'POST') return json({ message: '허용되지 않은 요청입니다.' }, 405);
    if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json'))
      return json({ message: '허용되지 않은 요청입니다.' }, 403);
    const raw = await request.text();
    if (raw.length > 10000) return json({ message: '요청이 너무 큽니다.' }, 413);
    let input;
    try { input = JSON.parse(raw); } catch { return json({ message: '요청 형식을 확인해 주세요.' }, 400); }
    if (!input || !['create', 'confirm'].includes(input.action)) return json({ message: '잘못된 요청입니다.' }, 400);
    const api = payment.service({ env: process.env, store: getStore({ name: 'test-orders', consistency: 'strong' }) });
    return json(await api[input.action](input));
  } catch (e) {
    return json({ message: e.status ? e.message : '주문 저장·확인에 실패했습니다. 고객센터로 문의해 주세요.' }, e.status || 503);
  }
}
