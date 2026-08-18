// [키 교체 지점] 아래는 토스페이먼츠 공식 문서의 공용 테스트 클라이언트 키입니다.
// 전자계약 완료 후 상점관리자(MID: spacew90od) > 개발자센터에서 발급받은
// "결제위젯 클라이언트 키(live_gck_... 또는 test_gck_...)"로 교체하세요.
const CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

document.addEventListener("DOMContentLoaded", async () => {
  const s = getSession();
  document.getElementById("o-title").textContent = s.title;
  document.getElementById("o-price").textContent = won(s.price);
  document.getElementById("o-schedule").textContent = s.schedule;
  document.getElementById("o-total").textContent = won(s.price);

  const tossPayments = TossPayments(CLIENT_KEY);
  const widgets = tossPayments.widgets({ customerKey: TossPayments.ANONYMOUS });
  await widgets.setAmount({ currency: "KRW", value: s.price });
  await Promise.all([
    widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
    widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" })
  ]);

  const btn = document.getElementById("pay-btn");
  const boxes = [document.getElementById("agree-refund"), document.getElementById("agree-once")];
  const sync = () => { btn.disabled = !boxes.every(b => b.checked); };
  boxes.forEach(b => b.addEventListener("change", sync));

  btn.addEventListener("click", async () => {
    const name = document.getElementById("f-name").value.trim();
    const phone = document.getElementById("f-phone").value.trim();
    const email = document.getElementById("f-email").value.trim();
    if (!name || !phone) { alert("이름과 휴대폰 번호를 입력해 주세요."); return; }
    try {
      await widgets.requestPayment({
        orderId: "order-" + s.id + "-" + Date.now(),
        orderName: s.title,
        customerName: name,
        customerEmail: email || undefined,
        customerMobilePhone: phone.replace(/-/g, "") || undefined,
        successUrl: location.origin + "/success.html",
        failUrl: location.origin + "/fail.html"
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 경우 등 — 별도 처리 없음
      console.log(e);
    }
  });
});
