/**
 * Netlify build 時確認環境變數存在，並寫入前端使用的 API 位置。
 * 必要環境變數：APPS_SCRIPT_WEB_APP_URL、FORM_TOKEN
 *
 * 本機測試（專案根目錄）：
 *   APPS_SCRIPT_WEB_APP_URL='https://script.google.com/macros/s/.../exec' FORM_TOKEN='你的token' node inject-env.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.APPS_SCRIPT_WEB_APP_URL || '';
const token = process.env.FORM_TOKEN || '';

if (!url || !token) {
  console.error('inject-env: 缺少環境變數，請設定 APPS_SCRIPT_WEB_APP_URL 與 FORM_TOKEN');
  process.exit(1);
}

const runtimeBody =
  '(function () {\n' +
  '  window.STARSHINE_CONFIG = window.STARSHINE_CONFIG || {};\n' +
  '  window.STARSHINE_CONFIG.formEndpoint = ' + JSON.stringify('/api/lead-form') + ';\n' +
  '})();\n';

const outPath = path.join(__dirname, 'config.runtime.js');
fs.writeFileSync(outPath, runtimeBody, 'utf8');
console.log('inject-env: 已寫入', path.basename(outPath));
