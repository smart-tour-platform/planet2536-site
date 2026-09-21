document.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('result-title'), message = document.getElementById('result-message');
  const retry = document.getElementById('retry-confirm'), detail = document.getElementById('order-details');
  const query = new URLSearchParams(location.search);
  const orderId = query.get('orderId');
  let input;
  try {
    if (orderId) {
      input = { action: 'confirm', orderId, paymentKey: query.get('paymentKey'), amount: Number(query.get('amount')),
        token: sessionStorage.getItem('pp-order-' + orderId) };
      sessionStorage.setItem('pp-confirm', JSON.stringify(input));
      history.replaceState(null, '', '/success.html');
    } else input = JSON.parse(sessionStorage.getItem('pp-confirm') || 'null');
  } catch { input = null; }
  if (!input?.token || !input.paymentKey || !Number.isSafeInteger(input.amount) || input.amount <= 0) {
    title.textContent = '주문을 확인할 수 없습니다';
    message.textContent = '정상적인 결제 경로로 접근해 주세요. 결제를 진행했다면 고객센터 010-5062-1625로 문의해 주세요.';
    return;
  }
  async function confirm() {
    retry.hidden = true; title.textContent = '결제 승인 확인 중'; message.textContent = '서버에서 주문과 승인 결과를 확인하고 있습니다.';
    try {
      const order = await paymentAPI(input);
      if (order.status !== 'DONE') throw new Error('아직 결제가 완료되지 않았습니다.');
      document.getElementById('result-icon').textContent = '✓';
      title.textContent = '결제 완료 · 참여 신청이 접수되었습니다';
      message.textContent = '모임 진행 확정은 별도로 안내합니다. 아래 주문번호를 보관해 주세요.';
      detail.replaceChildren();
      const rows = [['주문번호', order.orderId], ['상품', order.title], ['구매 범위', order.purchaseScope],
        ['결제금액', won(order.amount)], ['결제수단', order.method], ['승인 시각', formatDate(order.approvedAt)],
        ['일정', scheduleText(order)], ['장소', order.place], ['호스트', order.host], ['동의 정책', order.policyVersion]];
      for (const [label, value] of rows) { const p = document.createElement('p'); p.textContent = label + ': ' + value; detail.append(p); }
    } catch (e) {
      title.textContent = '결제 완료를 확인하지 못했습니다'; message.textContent = e.message;
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', confirm); confirm();
});
