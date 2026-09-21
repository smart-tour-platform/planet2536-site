// 주문 생성 시 정책 버전과 게시 본문의 해시를 함께 보존합니다.
const POLICY = {
  version: '1.5',
  reviewed: true,
  documentEffectiveDate: '2026-09-20',
  sourcePath: '/refund.html',
  sourceSha256: 'd1ecb92dc3d98e9e27444c8c00cfa00ec9be59cf6ec9584bbea21c49e7460a59',
  effectiveAt: '2026-09-21T00:00:00+09:00',
  summary: '일반 취소는 해당 모임 시작 시각까지 24시간 이상 남은 경우 해당 모임분 전액 환불되며, 24시간 미만인 경우 제한됩니다. 다회차형은 각 모임별로 적용합니다. 일정 연기 등에 따른 추가 환불권과 관계 법령에 따른 청약철회·해지·환급권은 별도로 적용됩니다. 자세한 기준은 취소·환불정책에서 확인할 수 있습니다.'
};
if (typeof module !== 'undefined') module.exports = POLICY;
