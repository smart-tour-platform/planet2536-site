// 세션 상품 데이터 — 실제 판매 예정가(기능정의서 기준 일반 세션 3,900원)
const SALE_LIMITS = { maxPaymentAmount: 990000, currency: 'KRW', scope: '단발형 또는 차수 전체 1회 결제' };
const SESSIONS = [
  {
    id: "running",
    img: "assets/running.png",
    tag: "러닝",
    title: "한강 저녁 러닝 세션 (5km 초급)",
    host: "김존 (프롬더허들 · 진행 담당 배정안)",
    place: "서울 영등포구 여의도한강공원 — 여의나루역 2번 출구 앞 지상 집결, 19:20부터 출석 확인",
    schedule: "2026년 10월 8일(목) 19:30 ~ 21:00",
    meetings: [{ startAt: '2026-10-08T19:30:00+09:00', endAt: '2026-10-08T21:00:00+09:00' }],
    deadlineAt: '2026-10-07T19:30:00+09:00',
    taxType: 'taxable',
    taxVerified: false,
    included: ['호스트 진행', '준비운동 및 마무리 스트레칭', '초급 5km 그룹 러닝'],
    extraCosts: '필수 현장 추가 결제 없음. 개인 교통·주차·음료 구매비는 본인 부담. 러닝화와 물은 개별 지참.',
    planNote: '운영 예정안: 표시 일정·담당자·집결 장소로 준비하며, 담당자 배정 및 현장 운영·과세 확인 후 모집을 시작합니다.',
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
    host: "호스트 확정 후 안내",
    place: "대전 유성구 소재 클라이밍짐 (모임 확정 후 상세 위치 안내)",
    schedule: "판매 일정 준비 중",
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
    host: "호스트 확정 후 안내",
    place: "대전 유성구 카페 (모임 확정 후 상세 위치 안내)",
    schedule: "판매 일정 준비 중",
    people: "최소 3명 ~ 최대 6명",
    price: 3900,
    desc: "각자 읽고 있는 책을 가져와 조용히 읽고, 마지막 30분간 짧게 나누는 느슨한 독서 모임입니다. 장르 제한이 없으며 음료는 개별 주문합니다.",
    grad: ["#3B4A72", "#93A3C9"],
    art: "book"
  }
];
// 실제 운영 정보가 확정되면 해당 상품을 편집합니다. 날짜는 +09:00 포함 ISO 형식.
SESSIONS.forEach(s => Object.assign(s, {
  saleStatus: 'draft',
  meetings: [], // [{ startAt: '...', endAt: '...' }]
  deadlineAt: null,
  hostVerified: false,
  placeVerified: false,
  taxType: null, // taxable / exempt (운영 확인 필수)
  taxVerified: false,
  included: [],
  extraCosts: null, // 별도 비용이 없으면 '없음'
  purchaseScope: '단발형 · 총 1회 참여',
  ...s,
}));
function formatDate(value) {
  return value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) + ' (한국시간)' : '확정 후 안내';
}
function scheduleText(s) {
  return s.meetings.length ? s.meetings.map((m, i) => `${i+1}회: ${formatDate(m.startAt)} ~ ${formatDate(m.endAt)}`).join(' / ') : s.schedule;
}
if (typeof module !== 'undefined') module.exports = { SESSIONS, SALE_LIMITS };
function svgArt(s, h){
  // 기존 포스터에는 미확정 반복 일정이 이미지에 포함되어 있어 텍스트 카드로 표시합니다.
  return `<div class="session-art" style="background:linear-gradient(135deg,${s.grad[0]},${s.grad[1]})"><span>${s.tag}</span><strong>함께하는 ${s.tag}</strong><small>일정과 구매 범위는 상품정보에서 확인하세요</small></div>`;
}
function won(n){ return n.toLocaleString("ko-KR") + "원"; }
function getSession(){
  const id = new URLSearchParams(location.search).get("id");
  return SESSIONS.find(s => s.id === id);
}
