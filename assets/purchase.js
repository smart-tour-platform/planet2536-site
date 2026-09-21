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
    ['포함 항목', s.included.join(', ') || '확정 후 안내'], ['별도 비용', s.extraCosts || '확정 후 안내'],
    ['금액 안내', !s.taxType ? '최종 예정 금액 · 과세 구분 확인 중' : !s.taxVerified ? '최종 예정 금액 · 과세상품 설정안 (VAT 포함), 운영 과세 확인 대기' : s.taxType === 'taxable' ? '최종 결제금액 (VAT 포함)' : '최종 결제금액 (면세)'],
    ['운영 상태', s.planNote || (s.saleStatus === 'open' ? '모집 중' : '판매 준비 중')],
    ['취소·청약철회 접수', '010-5062-1625 · john@fromthehurdle.com (주문번호·신청자명·취소할 모임·사유 전달)']
  ];
  const table = document.getElementById(id);
  table.replaceChildren();
  rows.forEach(([label, value]) => {
    const tr = document.createElement('tr'), th = document.createElement('th'), td = document.createElement('td');
    th.textContent = label; td.textContent = value; tr.append(th, td); table.append(tr);
  });
}
