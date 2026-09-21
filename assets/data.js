const SALE_LIMITS = { maxPaymentAmount: 990000, currency: 'KRW', scope: '단발형 또는 차수 전체 1회 결제' };
const RUNNING = {
  tag: '러닝', host: '김존 (프롬더허들)',
  place: '서울 영등포구 여의도한강공원 — 여의나루역 2번 출구 앞 지상 집결, 19:20 출석 확인',
  people: '최소 3명 ~ 최대 8명', saleStatus: 'open', taxType: 'taxable',
  included: ['호스트 진행', '준비운동', '초급 5km 그룹 러닝', '마무리 스트레칭'],
  extraCosts: '필수 추가 결제 없음. 개인 교통·주차·음료 구매비는 본인 부담. 러닝화와 물은 개별 지참.',
  grad: ['#1E5C46', '#7FB69B']
};
const SESSIONS = [
  {
    ...RUNNING, id: 'running', productType: 'single',
    title: '한강 저녁 러닝 세션 (5km 초급)', price: 3900,
    purchaseScope: '단발형 · 총 1회 참여',
    meetings: [{ startAt: '2026-10-08T19:30:00+09:00', endAt: '2026-10-08T21:00:00+09:00' }],
    deadlineAt: '2026-10-07T19:30:00+09:00',
    desc: '10월 8일 목요일 저녁, 초급 페이스(6:30~7:00/km)로 함께 5km를 달립니다. 이번 결제는 이날 모임 1회에 대한 참여비입니다.'
  },
  {
    ...RUNNING, id: 'running-term-1', productType: 'term', programId: 'running-october', termNumber: 1,
    title: '10월 화요일 러닝 — 1차수 4회', price: 15600,
    purchaseScope: '차수형 · 1차수 · 총 4회 참여',
    meetings: [
      { startAt: '2026-10-06T19:30:00+09:00', endAt: '2026-10-06T21:00:00+09:00' },
      { startAt: '2026-10-13T19:30:00+09:00', endAt: '2026-10-13T21:00:00+09:00' },
      { startAt: '2026-10-20T19:30:00+09:00', endAt: '2026-10-20T21:00:00+09:00' },
      { startAt: '2026-10-27T19:30:00+09:00', endAt: '2026-10-27T21:00:00+09:00' }
    ],
    deadlineAt: '2026-10-05T19:30:00+09:00',
    desc: '10월 매주 화요일, 총 4회의 초급 그룹 러닝에 참여합니다. 15,600원을 한 번 결제하면 10월 6·13·20·27일 모임이 모두 포함됩니다. 다음 차수는 자동 결제되지 않습니다.',
    grad: ['#233D65', '#829CC2']
  },
  {
    ...RUNNING, id: 'running-weekend-term-1', productType: 'term', programId: 'running-weekend-october', termNumber: 1,
    title: '10월 토요일 아침 러닝 — 1차수 3회', price: 11700,
    purchaseScope: '차수형 · 1차수 · 총 3회 참여',
    place: '서울 영등포구 여의도한강공원 — 여의나루역 2번 출구 앞 지상 집결, 08:50 출석 확인',
    meetings: [
      { startAt: '2026-10-10T09:00:00+09:00', endAt: '2026-10-10T10:30:00+09:00' },
      { startAt: '2026-10-17T09:00:00+09:00', endAt: '2026-10-17T10:30:00+09:00' },
      { startAt: '2026-10-24T09:00:00+09:00', endAt: '2026-10-24T10:30:00+09:00' }
    ],
    deadlineAt: '2026-10-09T09:00:00+09:00',
    desc: '10월 토요일 아침, 초급 페이스로 함께 5km를 달리는 3회 과정입니다. 11,700원을 한 번 결제하면 10월 10·17·24일 모임이 모두 포함됩니다. 다음 차수는 자동 결제되지 않습니다.',
    grad: ['#865020', '#D8AE76']
  }
];
function dateParts(value) {
  return Object.fromEntries(new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
}
function shortDate(d, withYear = false) {
  return `${withYear ? d.year + '년 ' : ''}${d.month}월 ${d.day}일(${d.weekday})`;
}
function clockTime(d) { return `${d.hour}:${d.minute}`; }
function formatDate(value) {
  if (!value) return '—';
  const d = dateParts(value);
  return `${shortDate(d, true)} ${clockTime(d)}`;
}
function scheduleText(s) {
  const meetings = s.meetings.map(m => ({ start: dateParts(m.startAt), end: dateParts(m.endAt) }));
  const years = new Set(meetings.flatMap(m => [m.start.year, m.end.year]));
  const header = years.size === 1 ? `${meetings[0].start.year}년 · 한국시간` : '한국시간';
  return [header, ...meetings.map(({ start, end }, i) => {
    const sameDay = ['year', 'month', 'day'].every(k => start[k] === end[k]);
    const endLabel = sameDay ? clockTime(end) : `${shortDate(end, years.size > 1)} ${clockTime(end)}`;
    return `${i + 1}회 · ${shortDate(start, years.size > 1)} ${clockTime(start)}–${endLabel}`;
  })].join('\n');
}
function scheduleSummary(s) {
  if (s.meetings.length === 1) return scheduleText(s);
  const first = dateParts(s.meetings[0].startAt), last = dateParts(s.meetings.at(-1).endAt);
  return `${first.year}년 · 한국시간\n${first.month}/${first.day}–${first.year !== last.year ? last.year + '/' : ''}${last.month}/${last.day} · 총 ${s.meetings.length}회`;
}
function saleLabel(s, now = Date.now()) {
  if (now >= Date.parse(s.deadlineAt)) return '신청 마감';
  if (now < Date.parse(s.meetings[0].startAt) - 28 * 86400000) return '신청 시작 전';
  return '신청 가능';
}
if (typeof module !== 'undefined') module.exports = { SESSIONS, SALE_LIMITS };
function svgArt(s) {
  return `<div class="session-art" style="background:linear-gradient(135deg,${s.grad[0]},${s.grad[1]})"><span>${s.productType === 'term' ? '차수형' : '단발형'} · ${s.meetings.length}회</span><strong>함께하는 ${s.tag}</strong><small>${s.purchaseScope}</small></div>`;
}
function won(n) { return n.toLocaleString('ko-KR') + '원'; }
function getSession() { return SESSIONS.find(s => s.id === new URLSearchParams(location.search).get('id')); }
