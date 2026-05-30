// 公開預設：可提交到 GitHub。正式部署時由 Netlify build 產生的 config.runtime.js 覆寫 API 位置。
(function () {
  window.STARSHINE_CONFIG = window.STARSHINE_CONFIG || {};
  window.STARSHINE_CONFIG.formEndpoint = window.STARSHINE_CONFIG.formEndpoint || '';
  window.STARSHINE_CONFIG.formSource   = window.STARSHINE_CONFIG.formSource   || 'starshine-pathway-cta';
})();
