const { createHash } = require('node:crypto');
const { SESSIONS } = require('../../assets/data.js');
const DAY = 86400000;
const REVIEW_NOTICE = '심사용 테스트 상품입니다. 일정은 결제 흐름 확인용 예시이며 실제 모임 예약이나 금액 청구가 발생하지 않습니다.';

function catalog(mode, now = Date.now(), products = SESSIONS) {
  const result = structuredClone(products);
  if (mode === 'test') {
    for (const p of result) {
      // Preserve weekday, duration and number of meetings. Only TEST samples roll.
      const start = Date.parse(p.meetings[0].startAt);
      const weeks = Math.max(0, Math.ceil((now + 7 * DAY - start) / (7 * DAY)));
      const shift = weeks * 7 * DAY;
      const iso = value => new Date(Date.parse(value) + shift).toISOString();
      p.meetings = p.meetings.map(m => ({ startAt: iso(m.startAt), endAt: iso(m.endAt) }));
      p.deadlineAt = iso(p.deadlineAt);
      p.title = '[테스트] ' + p.title.replace(/^\d+월 /, '');
      p.desc = REVIEW_NOTICE;
      p.reviewSample = true;
    }
  }
  const version = createHash('sha256').update(JSON.stringify({ mode, products: result })).digest('hex');
  return { products: result, catalogVersion: version, reviewNotice: mode === 'test' ? REVIEW_NOTICE : '', serverTime: now };
}
module.exports = { catalog };
