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
catch { problems.push('상점 테스트 키·MID·주문 암호화 키·PAYMENTS_ENABLED 설정 필요 (값은 출력하지 않음)'); }
if (!['taxable', 'exempt', 'mixed'].includes(process.env.TOSS_TAX_MODE)) problems.push('상점 계약 과세 유형 TOSS_TAX_MODE 확인 필요');
if (problems.length) {
  console.log('테스트 결제 개방 대기:\n' + problems.map(p => '- ' + p).join('\n'));
  process.exitCode = 1;
} else console.log('로컬 필수 설정 충족. 배포 URL에서 실제 상점 테스트 승인·운영 절차를 별도로 확인하세요.');
