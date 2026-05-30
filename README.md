# 星耀 · 健康路徑計畫 Landing Page

> 先看懂，再決定，走一條更安心的健康收入路徑。

靜態落地頁，部署於 Netlify，表單資料經由 Netlify Function 轉送到 Google Apps Script，再寫入 Google 試算表。

---

## 專案結構

```
project/
├── index.html                        # 主頁面（只有語意結構，無 inline style / script）
│
├── css/
│   ├── tokens.css                    # Layer 1 — Design DNA（所有 CSS 變數）
│   ├── primitives.css                # Layer 2 — 中性佈局原語（reveal、h-scroll…）
│   ├── components/
│   │   └── nav.css                   # top-bar、drawer、floating CTA
│   └── chapters/
│       ├── ch01-hero.css
│       ├── ch02-pain.css
│       ├── ch03-compare.css
│       ├── ch04-market.css
│       ├── ch05-trust.css
│       ├── ch06-cases.css
│       └── ch07-cta.css
│
├── js/
│   ├── main.js                       # top-bar scroll、pain accordion、reveal、form、bottom CTA
│   ├── compare.js                    # ch03b pill tabs、箭頭導航、swipe
│   ├── contacts.js                   # ch04 scroll-driven 聯絡人面板
│   └── concern-acc.js                # ch05 疑慮 accordion
│
├── images/                           # 頁面圖片素材
├── netlify/functions/lead-form.mjs   # 表單中間層：轉送到 Google Apps Script
├── config.public.js                  # 公開預設設定（進 Git）
├── config.runtime.js                 # Build 時產生的前端 API 設定（不進 Git）
├── inject-env.mjs                    # Netlify build script
├── netlify.toml                      # Netlify 建置設定
├── google_apps_script_lead_form.gs   # Google Apps Script 後端程式碼
├── DESIGN.md                         # 設計系統文件（每章 art direction）
├── .gitignore
└── README.md
```

### CSS 三層架構

| 層次 | 檔案 | 職責 |
|------|------|------|
| Layer 1 | `css/tokens.css` | 所有品牌 CSS 變數：色票、字型比例、間距節奏、動畫曲線 |
| Layer 2 | `css/primitives.css` | 中性、語意的佈局積木：`.reveal`、`.h-scroll`、`.pull-quote`、`.corner-orn` |
| Layer 3 | `css/chapters/*.css` | 每章獨立的視覺語言，不重複使用跨章樣式 |

> **原則**：primitives 裡不出現 `border-radius + box-shadow + padding` 三連殺，避免「卡片感」氾濫。每章的設計決策記錄在 `DESIGN.md`。

---

## 架構說明

### 資料流

```
使用者填表單（index.html）
    │
    │  fetch POST（同站 /api/lead-form）
    ▼
Netlify Function
    │  加上 FORM_TOKEN，轉送到 Apps Script
    ▼
Google Apps Script Web App
    │  驗證 token、honeypot、必填欄位、時間戳記、rate limit
    ▼
Google 試算表（Leads 工作表）
    │
    └─→ Email 通知（選填）
```

### 密鑰保護機制

```
Netlify Dashboard
  APPS_SCRIPT_WEB_APP_URL = https://script.google.com/...
  FORM_TOKEN              = 你自訂的隨機字串
       │
       │  git push → Netlify 觸發 build
       ▼
  node inject-env.mjs
       │  確認環境變數存在，寫入
       ▼
  config.runtime.js（build 產物，不進 Git）
       │  index.html 載入
       ▼
  window.STARSHINE_CONFIG.formEndpoint = /api/lead-form
```

Netlify Function 執行時會讀取 `APPS_SCRIPT_WEB_APP_URL` 與 `FORM_TOKEN`。

**重點：Apps Script URL 與 Token 永遠不會出現在 GitHub 原始碼或瀏覽器前端裡。**

---

## 表單安全防護層

| 防護機制 | 說明 |
|----------|------|
| `FORM_TOKEN` 驗證 | Netlify Function 與 Apps Script 共享密鑰，陌生請求直接拒絕 |
| Honeypot 欄位 | 隱藏的 `website` 欄位，機器人會填，後端偵測到即拒絕 |
| 時間戳記驗證 | `submittedAt` 偏差超過 10 分鐘的請求視為過期 |
| Rate limiting | 同一手機號碼 120 秒內只接受一次（Apps Script Cache） |
| 必填欄位驗證 | 姓名、手機、最想了解為必填，後端再次驗證 |

---

## 本機開發

直接用瀏覽器開啟 `index.html` 即可預覽（Tailwind Play CDN 會即時編譯，不需 build）。

表單在本機直接開 `index.html` 不會真正送出（`config.runtime.js` 不存在，endpoint 為空字串）。

若要在本機測試完整表單送出：

```bash
# 在專案根目錄執行（替換成真實值）
APPS_SCRIPT_WEB_APP_URL='https://script.google.com/macros/s/.../exec' \
FORM_TOKEN='你的token' \
node inject-env.mjs
```

執行後會產生 `config.runtime.js`。正式送出仍建議在 Netlify 部署後測試，因為表單會送到 Netlify Function `/api/lead-form`。

> **注意：測試完請勿將 `config.runtime.js` 提交到 Git。**

### 修改 CSS

| 修改對象 | 編輯檔案 |
|----------|----------|
| 品牌色票 / 字型 / 間距 | `css/tokens.css` |
| 全域動畫 / 通用積木 | `css/primitives.css` |
| Nav、drawer、floating CTA | `css/components/nav.css` |
| 某一章的視覺樣式 | `css/chapters/chXX-*.css` |
| Tailwind 設定 / `@layer` 元件 | `index.html` 的 `<head>`（Play CDN 限制，必須內嵌） |

### 修改 JavaScript

| 功能模組 | 編輯檔案 |
|----------|----------|
| Top-bar scroll、pain accordion、reveal、form、bottom CTA | `js/main.js` |
| Ch03b 副業評估卡片（pill tabs、swipe） | `js/compare.js` |
| Ch04 聯絡人面板（scroll-driven） | `js/contacts.js` |
| Ch05 疑慮 accordion | `js/concern-acc.js` |

---

## 部署流程

### Step 1 — 建立 Google 試算表與 Apps Script

1. 開啟 [Google 試算表](https://sheets.google.com)，建立新試算表
2. 複製試算表網址中 `/d/` 與 `/edit` 之間的字串，即為 `SPREADSHEET_ID`
3. 點選「擴充功能 → Apps Script」
4. 將 `google_apps_script_lead_form.gs` 的內容全部貼入
5. 設定「指令碼屬性」（專案設定 → 指令碼屬性 → 新增屬性）：

| 屬性名稱 | 說明 |
|----------|------|
| `SPREADSHEET_ID` | 試算表 ID |
| `FORM_TOKEN` | 自訂隨機字串（英數字，建議 32 字元以上） |
| `NOTIFY_EMAIL` | 收新名單通知的信箱（可留空） |

6. 執行函式 `authorizeOnce()`，完成 OAuth 授權（只需一次）
7. 部署 → 新增部署 → 類型選「網路應用程式」
   - 執行身分：**我**
   - 存取權：**任何人**
8. 複製產生的 Web App URL（`https://script.google.com/macros/s/.../exec`）

---

### Step 2 — 推送到 GitHub

```bash
git init
git add .
git commit -m "init: starshine pathway landing page"
git remote add origin https://github.com/你的帳號/starshine-landing.git
git push -u origin main
```

---

### Step 3 — 設定 Netlify

1. 登入 [Netlify](https://app.netlify.com)
2. Add new site → Import an existing project → GitHub
3. 選擇剛才推送的 repo
4. Build settings 會自動讀取 `netlify.toml`（`node inject-env.mjs`）
5. 到 **Site configuration → Environment variables** 新增：

| 變數名稱 | 值 |
|----------|----|
| `APPS_SCRIPT_WEB_APP_URL` | Step 1 複製的 Web App URL |
| `FORM_TOKEN` | 與 Apps Script 指令碼屬性完全相同的字串 |

6. 觸發重新部署（Deploys → Trigger deploy）
7. 部署完成後，打開網站送出一筆測試資料：
   - 成功：試算表 `Leads` 工作表會新增一列
   - 失敗：表單下方會顯示 Google Apps Script 回傳的錯誤訊息

---

### 之後更新網站

```bash
# 修改任何檔案後
git add .
git commit -m "update: 說明修改內容"
git push
```

Netlify 偵測到 push 後自動 build 並部署，約 30 秒內更新。

---

## 試算表欄位說明

`Leads` 工作表的欄位依序為：

| 欄位 | 說明 |
|------|------|
| 建立時間 | Apps Script 寫入時間 |
| 姓名 | 使用者填寫 |
| 手機 | 強制文字格式（保留前導 0） |
| LINE ID | 選填 |
| 最想了解 | 下拉選單選項 |
| 來源 | `starshine-pathway-cta` |
| 提交時間(ISO) | 瀏覽器的 ISO 時間字串 |
| User-Agent | 瀏覽器資訊 |

---

## 除錯

表單送出後顯示成功，但試算表沒有資料？

1. 開啟 Netlify → Functions → `lead-form` logs，確認有沒有錯誤
2. 開啟 Apps Script → 執行紀錄，確認 `doPost` 有被觸發
3. 確認 Netlify 的 `FORM_TOKEN` 與 Apps Script 指令碼屬性的 `FORM_TOKEN` 完全一致（注意空白）
4. 確認 `APPS_SCRIPT_WEB_APP_URL` 是 `/exec` 結尾的 Web App URL，不是 `/dev`
5. 確認 Apps Script 部署設定：
   - 執行身分：我
   - 存取權：任何人
6. 確認 `SPREADSHEET_ID` 正確，且該 Google 帳號有試算表編輯權限
7. 確認 Apps Script 已重新部署（每次修改 `.gs` 都要重新部署才生效）

CSS 樣式沒有生效？

1. 確認 `index.html` 的 `<link>` 路徑與 CSS 檔案位置一致
2. Tailwind Play CDN 的自訂元件類別（`wrap`、`btn-primary` 等）必須定義在 `<style type="text/tailwindcss">` 裡，不能移到外部 CSS 檔案
3. 開啟瀏覽器 DevTools → Network 頁籤，確認所有 CSS / JS 回傳 200
