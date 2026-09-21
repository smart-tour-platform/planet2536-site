async function paymentAPI(body) {
  const response = await fetch('/.netlify/functions/payments', body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  } : { cache: 'no-store' });
  let data;
  try { data = await response.json(); } catch { throw new Error('결제 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'); }
  if (!response.ok) throw new Error(data.message || '결제를 확인할 수 없습니다.');
  return data;
}
function renderPurchaseInfo(id, s) {
  const rows = [
    ['구매 범위', s.purchaseScope], ['신청 마감', formatDate(s.deadlineAt)],
    ['제공 종료', formatDate(s.meetings.at(-1)?.endAt)], ['호스트', s.host], ['장소', s.place],
    ['포함 항목', s.included.join(', ')], ['별도 비용', s.extraCosts],
    ['금액 안내', s.taxType === 'taxable' ? '최종 결제금액 (VAT 포함)' : '최종 결제금액 (면세)'],
    ['모임별 환불 기준금액', won(Math.ceil(s.price / s.meetings.length)) + ' / 1회 · 누적 환불은 실제 결제잔액 이내'],
    ['결제 방식', s.productType === 'term' ? `${s.termNumber}차수의 모임 ${s.meetings.length}회를 묶어 총 ${won(s.price)}을 한 번 결제합니다. 다음 차수는 별도 신청·결제하며 자동 갱신되지 않습니다.` : '표시된 모임 1회에 대해 한 번 결제합니다.'],
    ['취소·청약철회 접수', '010-5062-1625 · john@fromthehurdle.com (주문번호·신청자명·취소할 모임·사유 전달)']
  ];
  if (s.productType === 'term') rows.splice(1, 0, ['차수·회차 안내', '차수는 함께 결제하는 모임 묶음이고, 회차는 실제 모임의 순서입니다. 한 차수는 최대 4주이며, 그 안의 모임 횟수는 상품마다 다릅니다.']);
  const table = document.getElementById(id);
  table.replaceChildren();
  rows.forEach(([label, value]) => {
    const tr = document.createElement('tr'), th = document.createElement('th'), td = document.createElement('td');
    th.textContent = label; td.textContent = value; tr.append(th, td); table.append(tr);
  });
}
