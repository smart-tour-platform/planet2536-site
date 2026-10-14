let catalogConfig;
async function loadCatalog() {
  const response = await fetch('/.netlify/functions/payments', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const config = await response.json();
  if (!response.ok) throw new Error(config.message || '상품 정보를 불러오지 못했습니다.');
  if (!Array.isArray(config.products) || !config.catalogVersion) throw new Error('상품 정보를 갱신 중입니다. 잠시 후 새로고침해 주세요.');
  SESSIONS.splice(0, SESSIONS.length, ...config.products);
  catalogConfig = config;
  if (config.reviewNotice) catalogNotice(config.reviewNotice);
  return config;
}
function catalogNotice(message) {
  let notice = document.getElementById('catalog-notice');
  if (!notice) {
    notice = document.createElement('p'); notice.id = 'catalog-notice';
    notice.className = 'notice'; notice.setAttribute('role', 'status');
    document.querySelector('main').prepend(notice);
  }
  notice.textContent = message;
}
