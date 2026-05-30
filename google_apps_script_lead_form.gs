/**
 * 星耀健康路徑計畫 — 落地頁表單後端
 *
 * Script properties 必設（擴充功能 → Apps Script → 專案設定 → 指令碼屬性）：
 * - SPREADSHEET_ID：試算表 ID（網址 /d/ 與 /edit 之間那段）
 * - FORM_TOKEN：與 Netlify 環境變數 FORM_TOKEN 完全相同的字串
 * - NOTIFY_EMAIL：收通知的信箱（可留空則不寄信）
 *
 * 部署方式：
 * 1. 執行一次 authorizeOnce() 完成授權
 * 2. 部署 → 新增部署 → 類型：網路應用程式
 *    執行身分：我 / 存取權：任何人
 * 3. 複製 Web App URL 貼到 Netlify 環境變數 APPS_SCRIPT_WEB_APP_URL
 */

function createJsonResponse_(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/** 強制以文字寫入，避免手機號碼前導 0 被當成數字吃掉 */
function asSheetPlainText_(value) {
  var t = String(value == null ? '' : value).trim();
  if (!t) return t;
  if (t.charAt(0) === "'") return t;
  return "'" + t;
}

function doPost(e) {
  var props          = PropertiesService.getScriptProperties();
  var expectedToken  = props.getProperty('FORM_TOKEN');
  var spreadsheetId  = String(props.getProperty('SPREADSHEET_ID') || '').trim();
  var notifyEmail    = String(props.getProperty('NOTIFY_EMAIL')    || '').trim();
  var sheetName      = 'Leads';

  if (!spreadsheetId) {
    return createJsonResponse_({ ok: false, message: '伺服器未設定 SPREADSHEET_ID。' });
  }

  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['建立時間', '姓名', '手機', 'LINE ID', '最想了解', '來源', '提交時間(ISO)', 'User-Agent']);
  }

  try {
    var payload = JSON.parse((e.postData && e.postData.contents) ? e.postData.contents : '{}');

    // Token 驗證
    if (!expectedToken || payload.token !== expectedToken) {
      return createJsonResponse_({ ok: false, message: '未授權的請求。' });
    }

    // Honeypot：machine 會填，人不會
    if (payload.website && String(payload.website).trim()) {
      return createJsonResponse_({ ok: false, message: '疑似機器人送出。' });
    }

    // 必填欄位
    if (!payload.name || !payload.phone) {
      return createJsonResponse_({ ok: false, message: '姓名與手機為必填欄位。' });
    }

    if (!payload.interest || !String(payload.interest).trim()) {
      return createJsonResponse_({ ok: false, message: '請選擇最想了解的項目。' });
    }

    // 時間戳記防重播（10 分鐘容許誤差）
    var submittedAt = payload.submittedAt ? new Date(payload.submittedAt) : null;
    var now = new Date();
    if (!submittedAt || isNaN(submittedAt.getTime()) ||
        Math.abs(now.getTime() - submittedAt.getTime()) > 10 * 60 * 1000) {
      return createJsonResponse_({ ok: false, message: '請求已過期，請重新送出。' });
    }

    // 同一手機 120 秒內只接受一次
    var cache   = CacheService.getScriptCache();
    var rateKey = 'starshine:pathway:phone:' + String(payload.phone).trim();
    if (cache.get(rateKey)) {
      return createJsonResponse_({ ok: false, message: '你剛剛已送出過，請稍後再試。' });
    }
    cache.put(rateKey, '1', 120);

    var ua = String(payload.userAgent || '').slice(0, 500);

    sheet.appendRow([
      new Date(),
      payload.name     || '',
      asSheetPlainText_(payload.phone   || ''),
      asSheetPlainText_(payload.lineId  || ''),
      payload.interest || '',
      payload.source   || '',
      payload.submittedAt || '',
      ua
    ]);

    if (notifyEmail) {
      MailApp.sendEmail(notifyEmail, '【新表單】星耀健康路徑計畫 有新名單', [
        '姓名：'       + (payload.name     || ''),
        '手機：'       + (payload.phone    || ''),
        'LINE ID：'    + (payload.lineId   || ''),
        '最想了解：'   + (payload.interest || ''),
        '來源：'       + (payload.source   || ''),
        '提交時間：'   + (payload.submittedAt || ''),
        'User-Agent：' + ua
      ].join('\n'));
    }

    return createJsonResponse_({ ok: true, message: '資料已成功寫入。' });

  } catch (error) {
    return createJsonResponse_({ ok: false, message: '伺服器處理失敗：' + error.message });
  }
}

function doGet() {
  return createJsonResponse_({ ok: true, service: 'Starshine Pathway lead form is running.' });
}

/** 首次部署前手動執行，完成 OAuth 授權 */
function authorizeOnce() {
  var spreadsheetId = String(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim();
  if (!spreadsheetId) throw new Error('請先設定 SPREADSHEET_ID');
  SpreadsheetApp.openById(spreadsheetId);
  MailApp.getRemainingDailyQuota();
}
