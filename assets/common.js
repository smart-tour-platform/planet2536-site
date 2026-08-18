document.addEventListener("DOMContentLoaded", () => {
  const nav = `
  <div class="nav"><div class="wrap">
    <a class="brand" href="index.html">프롬더허들<span class="dot">.</span></a>
    <nav class="nav-links">
      <a href="index.html">소개</a>
      <a href="sessions.html">세션 둘러보기</a>
      <a href="refund.html">취소·환불 규정</a>
    </nav>
  </div></div>`;
  const footer = `
  <footer><div class="wrap">
    <div class="f-brand">프롬더허들</div>
    <div class="f-info">
      상호 : 프롬더허들 &nbsp;|&nbsp; 대표 : 김존<br>
      사업자등록번호 : 413-01-65526 &nbsp;|&nbsp; 통신판매업신고 : 2025-대전유성-0700<br>
      주소 : (34134) 대전 유성구 대학로 99, 충남대학교 산학연교육연구관 별관동 3층 309-1호<br>
      전화 : 010-5062-1625
    </div>
    <div class="f-links">
      <a href="terms.html">이용약관</a>
      <a href="privacy.html">개인정보처리방침</a>
      <a href="refund.html">취소·환불 규정</a>
    </div>
  </div></footer>`;
  document.body.insertAdjacentHTML("afterbegin", nav);
  document.body.insertAdjacentHTML("beforeend", footer);
});
