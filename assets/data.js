// 세션 상품 데이터 — 실제 판매 예정가(기능정의서 기준 일반 세션 3,900원)
const SESSIONS = [
  {
    id: "running",
    tag: "러닝",
    title: "한강 저녁 러닝 세션 (5km 초급)",
    host: "프롬더허들 인증 호스트",
    place: "서울 영등포구 여의도한강공원 (모임 확정 후 상세 위치 안내)",
    schedule: "매주 화·목 19:30 ~ 21:00 (회당 90분)",
    people: "최소 3명 ~ 최대 8명",
    price: 3900,
    desc: "초급 페이스(6:30~7:00/km)로 함께 달리는 저녁 러닝 세션입니다. 호스트가 준비운동부터 페이스 조절, 마무리 스트레칭까지 리드합니다. 개인 러닝화와 물만 준비하면 됩니다.",
    grad: ["#1E5C46", "#7FB69B"],
    art: "run"
  },
  {
    id: "climbing",
    tag: "클라이밍",
    title: "실내 클라이밍 입문 세션",
    host: "프롬더허들 인증 호스트",
    place: "대전 유성구 소재 클라이밍짐 (모임 확정 후 상세 위치 안내)",
    schedule: "매주 토 14:00 ~ 16:00 (회당 120분)",
    people: "최소 3명 ~ 최대 6명",
    price: 3900,
    desc: "볼더링을 처음 접하는 분을 위한 입문 세션입니다. 기본 무브와 홀드 잡는 법을 익히고 쉬운 문제부터 함께 풉니다. 암장 이용료·암벽화 대여비는 현장에서 개별 결제합니다.",
    grad: ["#B4690E", "#E4B368"],
    art: "climb"
  },
  {
    id: "book",
    tag: "독서",
    title: "주말 아침 독서 모임 세션",
    host: "프롬더허들 인증 호스트",
    place: "대전 유성구 카페 (모임 확정 후 상세 위치 안내)",
    schedule: "매주 일 10:00 ~ 12:00 (회당 120분)",
    people: "최소 3명 ~ 최대 6명",
    price: 3900,
    desc: "각자 읽고 있는 책을 가져와 조용히 읽고, 마지막 30분간 짧게 나누는 느슨한 독서 모임입니다. 장르 제한이 없으며 음료는 개별 주문합니다.",
    grad: ["#3B4A72", "#93A3C9"],
    art: "book"
  }
];
function svgArt(s, h){
  const uid = s.id;
  const shapes = {
    run:  `<path d="M0 ${h*0.78} Q 120 ${h*0.45} 260 ${h*0.7} T 520 ${h*0.55} V ${h} H 0 Z" fill="rgba(255,255,255,.22)"/><circle cx="430" cy="${h*0.3}" r="34" fill="rgba(255,255,255,.5)"/>`,
    climb:`<path d="M40 ${h} L 190 ${h*0.18} L 340 ${h} Z" fill="rgba(255,255,255,.28)"/><path d="M260 ${h} L 400 ${h*0.4} L 520 ${h} Z" fill="rgba(255,255,255,.16)"/><circle cx="196" cy="${h*0.42}" r="9" fill="#fff"/><circle cx="238" cy="${h*0.6}" r="9" fill="#fff"/>`,
    book: `<rect x="150" y="${h*0.3}" width="100" height="${h*0.5}" rx="6" fill="rgba(255,255,255,.5)"/><rect x="262" y="${h*0.22}" width="100" height="${h*0.58}" rx="6" fill="rgba(255,255,255,.3)"/><line x1="170" y1="${h*0.42}" x2="230" y2="${h*0.42}" stroke="rgba(30,40,60,.35)" stroke-width="5"/><line x1="170" y1="${h*0.52}" x2="230" y2="${h*0.52}" stroke="rgba(30,40,60,.25)" stroke-width="5"/>`
  };
  return `<svg class="thumb" viewBox="0 0 520 ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${s.tag} 세션 대표 이미지">
    <defs><linearGradient id="g-${uid}-${h}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${s.grad[0]}"/><stop offset="1" stop-color="${s.grad[1]}"/>
    </linearGradient></defs>
    <rect width="520" height="${h}" fill="url(#g-${uid}-${h})"/>${shapes[s.art]}
  </svg>`;
}
function won(n){ return n.toLocaleString("ko-KR") + "원"; }
function getSession(){
  const id = new URLSearchParams(location.search).get("id");
  return SESSIONS.find(s => s.id === id) || SESSIONS[0];
}
