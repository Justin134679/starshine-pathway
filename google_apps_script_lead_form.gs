/**
 * 星耀健康路徑計畫 — 落地頁表單後端
 *
 * Script properties 必設（擴充功能 → Apps Script → 專案設定 → 指令碼屬性）：
 * - SPREADSHEET_ID：試算表 ID（網址 /d/ 與 /edit 之間那段）
 * - FORM_TOKEN：與 Netlify 環境變數 FORM_TOKEN 完全相同的字串
 * - NOTIFY_EMAIL：收通知的信箱（可留空則不寄信；多個收件人用逗號或分號分隔，例如 a@x.com,b@x.com,c@x.com）
 *
 * 部署方式：
 * 1. 執行一次 authorizeOnce() 完成授權
 * 2. 部署 → 新增部署 → 類型：網路應用程式
 *    執行身分：我 / 存取權：任何人
 * 3. 複製 Web App URL 貼到 Netlify 環境變數 APPS_SCRIPT_WEB_APP_URL
 */

var SHEET_NAME = 'Leads';

// 各欄位最大長度，避免超長垃圾資料
var MAX_LEN = {
  name: 40,
  phone: 30,
  line: 60,
  interest: 120,
  source: 60,
  userAgent: 500
};

function createJsonResponse_(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/** 寫入 Cloud 記錄，方便在「執行項目」除錯（不含 token 本體） */
function logLead_(tag, detail) {
  console.log('[starshine-lead] ' + tag + (detail ? ' | ' + detail : ''));
}

function doGet() {
  return createJsonResponse_({
    ok: true,
    service: 'Starshine Pathway lead form is running.',
    scriptId: ScriptApp.getScriptId()
  });
}

function doPost(e) {
  var props         = PropertiesService.getScriptProperties();
  var expectedToken = String(props.getProperty('FORM_TOKEN')    || '').trim();
  var spreadsheetId = String(props.getProperty('SPREADSHEET_ID') || '').trim();
  var notifyEmail   = String(props.getProperty('NOTIFY_EMAIL')   || '').trim();

  if (!spreadsheetId) {
    logLead_('REJECT', 'missing SPREADSHEET_ID');
    return createJsonResponse_({ ok: false, message: '伺服器未設定 SPREADSHEET_ID。' });
  }

  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);

    // Token 驗證
    if (!expectedToken || payload.token !== expectedToken) {
      logLead_('REJECT', 'token mismatch (script len=' + expectedToken.length + ', payload len=' + String(payload.token || '').length + ')');
      return createJsonResponse_({ ok: false, message: '未授權的請求。' });
    }

    // Honeypot：機器人會填、人不會。回 ok 假裝成功，避免暴露偵測規則
    if (cleanText_(payload.website)) {
      logLead_('IGNORE', 'honeypot');
      return createJsonResponse_({ ok: true, message: 'ignored' });
    }

    // 清洗 + 防公式注入 + 截斷長度（同時相容舊欄位名 line / businessType）
    var name      = neutralizeFormula_(cleanText_(payload.name)).slice(0, MAX_LEN.name);
    var phone     = neutralizeFormula_(cleanText_(payload.phone)).slice(0, MAX_LEN.phone);
    var line      = neutralizeFormula_(cleanText_(payload.lineId != null ? payload.lineId : payload.line)).slice(0, MAX_LEN.line);
    var interest  = neutralizeFormula_(cleanText_(payload.interest != null ? payload.interest : payload.businessType)).slice(0, MAX_LEN.interest);
    var source    = neutralizeFormula_(cleanText_(payload.source)).slice(0, MAX_LEN.source);
    var userAgent = neutralizeFormula_(cleanText_(payload.userAgent)).slice(0, MAX_LEN.userAgent);

    // 必填檢查
    if (!name || !phone) {
      logLead_('REJECT', 'missing name or phone');
      return createJsonResponse_({ ok: false, message: '姓名與手機為必填欄位。' });
    }
    if (!interest) {
      logLead_('REJECT', 'missing interest');
      return createJsonResponse_({ ok: false, message: '請選擇最想了解的項目。' });
    }

    // 時間戳記防重播（10 分鐘容許誤差）
    var submittedAt = payload.submittedAt ? new Date(payload.submittedAt) : null;
    var now = new Date();
    if (!submittedAt || isNaN(submittedAt.getTime()) ||
        Math.abs(now.getTime() - submittedAt.getTime()) > 10 * 60 * 1000) {
      logLead_('REJECT', 'submittedAt expired or invalid');
      return createJsonResponse_({ ok: false, message: '請求已過期，請重新送出。' });
    }

    // 同一手機 120 秒內只接受一次
    var cache   = CacheService.getScriptCache();
    var rateKey = 'starshine:pathway:phone:' + phone;
    if (cache.get(rateKey)) {
      logLead_('REJECT', 'rate limit phone=' + phone);
      return createJsonResponse_({ ok: false, message: '你剛剛已送出過，請稍後再試。' });
    }
    cache.put(rateKey, '1', 120);

    // 打開試算表
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    // 若是新分頁，先建立標題列（與 README 對齊）
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['建立時間', '姓名', '手機', 'LINE ID', '最想了解', '來源', '提交時間(ISO)', 'User-Agent']);
    }

    // 加鎖，避免同時寫入衝突
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      sheet.appendRow([
        new Date(),
        name,
        asSheetPlainText_(phone),
        asSheetPlainText_(line),
        interest,
        source,
        payload.submittedAt || '',
        userAgent
      ]);
    } finally {
      lock.releaseLock();
    }

    logLead_('OK', 'row appended spreadsheetId=' + spreadsheetId + ' sheet=' + SHEET_NAME);

    // 寄送通知信（失敗只記錄，不影響表單成功）
    var recipients = parseRecipients_(notifyEmail);
    if (recipients.length) {
      try {
        MailApp.sendEmail({
          to: recipients.join(','),
          subject: '【新表單】星耀健康路徑計畫 有新名單',
          body: [
            '姓名：'       + name,
            '手機：'       + phone,
            'LINE ID：'    + line,
            '最想了解：'   + interest,
            '來源：'       + source,
            '提交時間：'   + (payload.submittedAt || ''),
            'User-Agent：' + userAgent,
            '',
            '寫入試算表：' + spreadsheet.getName(),
            '寫入分頁：'   + sheet.getName(),
            '試算表網址：' + spreadsheet.getUrl()
          ].join('\n')
        });
      } catch (mailErr) {
        logLead_('MAIL_FAILED', mailErr.message || mailErr);
      }
    } else if (notifyEmail) {
      logLead_('MAIL_SKIP', 'NOTIFY_EMAIL has no valid addresses');
    }

    return createJsonResponse_({ ok: true, message: '資料已成功寫入。' });

  } catch (error) {
    console.error('FORM_SUBMIT_FAILED', error);
    return createJsonResponse_({ ok: false, message: '伺服器處理失敗。' });
  }
}

/** 首次部署前手動執行，完成 OAuth 授權 */
function authorizeOnce() {
  var spreadsheetId = String(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim();
  if (!spreadsheetId) throw new Error('請先設定 SPREADSHEET_ID');
  try {
    SpreadsheetApp.openById(spreadsheetId);
    MailApp.getRemainingDailyQuota();
    console.log('authorizeOnce OK | scriptId=' + ScriptApp.getScriptId() + ' | spreadsheetId length=' + spreadsheetId.length);
  } catch (error) {
    throw new Error('authorizeOnce 失敗：' + (error && error.message ? error.message : error));
  }
}

/** 手動執行這個函式，用來確認指令碼屬性與試算表連線狀態 */
function diagnoseSetup() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = String(props.getProperty('SPREADSHEET_ID') || '').trim();
  var formToken = String(props.getProperty('FORM_TOKEN') || '').trim();
  var notifyEmail = String(props.getProperty('NOTIFY_EMAIL') || '').trim();
  var result = {
    scriptId: ScriptApp.getScriptId(),
    hasSpreadsheetId: !!spreadsheetId,
    spreadsheetIdLength: spreadsheetId.length,
    hasFormToken: !!formToken,
    formTokenLength: formToken.length,
    hasNotifyEmail: !!notifyEmail,
    spreadsheetOpenOk: false,
    spreadsheetName: ''
  };

  if (!spreadsheetId) {
    console.log(JSON.stringify(result));
    throw new Error('SPREADSHEET_ID 是空的：請確認是在這個 Apps Script 專案的「指令碼屬性」設定。');
  }

  try {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    result.spreadsheetOpenOk = true;
    result.spreadsheetName = spreadsheet.getName();
    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    console.log(JSON.stringify(result));
    throw new Error('試算表打不開：' + (error && error.message ? error.message : error));
  }
}

/** 清洗字串：移除控制字元與前後空白 */
function cleanText_(value) {
  var s = String(value == null ? '' : value);
  return s.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

/** 防儲存格公式注入：開頭為 = + - @ 時加單引號 */
function neutralizeFormula_(text) {
  if (!text) return text;
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

/** 解析多收件人字串：用逗號 / 分號 / 空白分隔，去除重複與無效格式 */
function parseRecipients_(raw) {
  if (!raw) return [];
  var parts = String(raw).split(/[,;\s]+/);
  var seen = {};
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var email = parts[i].trim().toLowerCase();
    if (!email) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen[email]) continue;
    seen[email] = true;
    out.push(email);
  }
  return out;
}

/** 強制以文字寫入，避免手機號碼前導 0 被當成數字吃掉 */
function asSheetPlainText_(value) {
  var t = String(value == null ? '' : value).trim();
  if (!t) return t;
  if (t.charAt(0) === "'") return t;
  return "'" + t;
}
