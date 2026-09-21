document.addEventListener('DOMContentLoaded', async () => {
  const s = getSession(), btn = document.getElementById('pay-btn'), status = document.getElementById('checkout-status');
  if (!s) { status.textContent = '존재하지 않는 상품입니다.'; return; }
  document.getElementById('o-title').textContent = s.title;
  document.getElementById('o-price').textContent = won(s.price);
  document.getElementById('o-total').textContent = won(s.price) + ' (최종 금액)';
  document.getElementById('o-schedule').textContent = scheduleText(s);
  renderPurchaseInfo('o-details', s);
  document.getElementById('refund-summary').textContent = POLICY.summary;
  if (saleLabel(s) !== '신청 가능') { status.textContent = saleLabel(s) + '입니다. 표시된 신청 기간을 확인해 주세요.'; return; }
  let widgets, ready = false, busy = false, tossAgreed = false;
  const boxes = [...document.querySelectorAll('.agree input')];
  const sync = () => { btn.disabled = busy || !ready || !tossAgreed || !boxes.every(b => b.checked); };
  boxes.forEach(b => b.addEventListener('change', sync));
  try {
    const config = await paymentAPI();
    if (config.policyVersion !== POLICY.version) throw new Error('정책이 변경되었습니다. 새로고침해 주세요.');
    widgets = TossPayments(config.clientKey).widgets({ customerKey: TossPayments.ANONYMOUS });
    await widgets.setAmount({ currency: 'KRW', value: s.price });
    await widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: config.paymentVariant });
    const agreement = await widgets.renderAgreement({ selector: '#agreement', variantKey: config.agreementVariant });
    agreement.on('agreementStatusChange', data => { tossAgreed = data.agreedRequiredTerms; sync(); });
    ready = true; status.textContent = '테스트 결제입니다. 실제 금액은 청구되지 않습니다.'; sync();
  } catch (e) { status.textContent = e.message; }
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    const fields = ['f-name', 'f-phone', 'f-email'].map(id => document.getElementById(id));
    if (!fields.every(field => field.reportValidity())) return;
    busy = true; sync();
    try {
      sessionStorage.setItem('pp-storage-check', '1'); sessionStorage.removeItem('pp-storage-check');
      const [name, phone, email] = fields.map(f => f.value.trim());
      const order = await paymentAPI({ action: 'create', productId: s.id, name, phone, email,
        policyVersion: POLICY.version, agreements: { refund: true, once: true, privacy: true, terms: true } });
      sessionStorage.setItem('pp-order-' + order.orderId, order.token);
      await widgets.setAmount({ currency: 'KRW', value: order.amount });
      await widgets.requestPayment({ orderId: order.orderId, orderName: order.title, customerName: name,
        ...(order.taxFreeAmount ? { taxFreeAmount: order.taxFreeAmount } : {}),
        ...(email ? { customerEmail: email } : {}), customerMobilePhone: phone.replace(/[-\s]/g, ''),
        successUrl: location.origin + '/success.html', failUrl: location.origin + '/fail.html' });
    } catch (e) { status.textContent = e.code === 'USER_CANCEL' ? '결제를 취소했습니다. 다시 시도할 수 있습니다.' : e.message; }
    finally { busy = false; sync(); }
  });
});
