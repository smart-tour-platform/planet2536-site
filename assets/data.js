// 세션 상품 데이터 — 실제 판매 예정가(기능정의서 기준 일반 세션 3,900원)
const SESSIONS = [
  {
    id: "running",
    img: "assets/running.png",
    tag: "러닝",
    title: "한강 저녁 러닝 세션 (5km 초급)",
    host: "플래닛피플 인증 호스트",
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
    img: "assets/climbing.png",
    tag: "클라이밍",
    title: "실내 클라이밍 입문 세션",
    host: "플래닛피플 인증 호스트",
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
    img: "assets/read.png",
    tag: "독서",
    title: "주말 아침 독서 모임 세션",
    host: "플래닛피플 인증 호스트",
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
  return `<img class="thumb" src="${s.img}" alt="${s.tag} 세션 대표 이미지">`;
}
function won(n){ return n.toLocaleString("ko-KR") + "원"; }
function getSession(){
  const id = new URLSearchParams(location.search).get("id");
  return SESSIONS.find(s => s.id === id) || SESSIONS[0];
}
