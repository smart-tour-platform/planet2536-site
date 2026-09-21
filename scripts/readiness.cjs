const { SESSIONS } = require('../assets/data.js');
const policy = require('../assets/policy.js');
const { validateProduct, config } = require('../netlify/lib/payment.cjs');
require('./verify-policy.cjs');
const problems = [];
if (!policy.effectiveAt || !Number.isFinite(Date.parse(policy.effectiveAt))) problems.push('실제 웹 게시·공지·동의 적용일 미설정 (assets/policy.js effectiveAt)');
const opened = SESSIONS.filter(s => s.saleStatus === 'open');
if (!opened.length) problems.push('실제 정보가 확정된 판매 상품 없음 (assets/data.js)');
for (const s of opened) {
  try { validateProduct(s, Date.now(), policy); }
  catch (e) { problems.push(`${s.id}: ${e.message}`); }
}
try { config(process.env); }
catch { problems.push('TOSS_MODE에 맞는 상점 키 쌍·MID·주문 암호화 키·PAYMENTS_ENABLED 설정 필요 (값은 출력하지 않음)'); }
if (!['taxable', 'exempt', 'mixed'].includes(process.env.TOSS_TAX_MODE)) problems.push('상점 계약 과세 유형 TOSS_TAX_MODE 확인 필요');
if (problems.length) {
  console.log('결제 설정 확인 필요:\n' + problems.map(p => '- ' + p).join('\n'));
  process.exitCode = 1;
} else console.log(`로컬 필수 설정 충족 (${process.env.TOSS_MODE || 'test'}). 배포 URL의 상점 연결·승인 결과는 별도로 확인하세요.`);
