# 星耀 · 健康路徑計畫 — Design System

> 本文件是專案的設計決策來源。任何視覺修改前，先在這裡確認方向。

---

## 設計原則

### 避免的通病（「AI 卡片感」）

| 不做 | 原因 |
|------|------|
| Inter / Roboto / Arial 當主字型 | 零個性，讓頁面立即顯得廉價 |
| 紫色漸層 + 卡片堆疊 | 千篇一律的 SaaS 美學，與健康溫度格格不入 |
| `border-radius + box-shadow + padding` 三連殺 | 每個區塊都是「浮動卡片」，視覺層次消失 |
| 每個 section 共用同一個元件 | 頁面變成「功能卡片清單」，失去敘事感 |
| 資訊對稱、圖文並排到底 | 缺乏韻律，讀者眼球無法停留 |

### 追求的感受

- **溫度**：這是關於真實家庭收入的事，不是科技產品。
- **沉穩**：海軍藍 + 老金 + 奶白，傳遞穩健而非浮誇。
- **敘事**：每章是一個獨立章節，有自己的視覺重心和轉場節奏。
- **克制**：字型大、間距充足、留白多，資訊密度寧少勿多。

---

## Layer 1 — Design Tokens (`css/tokens.css`)

### 色票

| 變數 | 值 | 用途 |
|------|----|------|
| `--c-navy-deep` | `#051528` | 頁面最深底色 |
| `--c-navy-800` | `#071F3D` | Drawer、nav 背景 |
| `--c-navy-700` | `#0B2F5B` | ch02 深色 section |
| `--c-navy-bridge` | `#142944` | ch03 bridge block |
| `--c-navy-card` | `#10243A` | ch06/ch07 局部 |
| `--c-gold` | `#C69A4A` | 主金色，CTA、accent |
| `--c-gold-deep` | `#B0852E` | 較深金，border、active |
| `--c-gold-light` | `#D4AC63` | 淺金，hover |
| `--c-gold-cream` | `#E6C68A` | 深色背景上的金字 |
| `--c-cream` | `#F7F8F5` | 主奶白背景 |
| `--c-cream-warm` | `#F2EEE2` | ch03 暖奶白 |
| `--c-cream-plan` | `#F4F0E4` | ch04/ch05 |
| `--c-ink-900` | `#1F2933` | 主文字色 |
| `--c-ink-500` | `#525B68` | 次要文字 |
| `--c-slate` | `#4E5A66` | ch06/ch07 body |

**品牌色邏輯**：深海軍藍象徵穩健、老金象徵積累價值、奶白象徵家庭溫度。三色構成「信賴感」三角形，不引入其他強調色。

### 字型系統

| 變數 | 字型 | 使用場景 |
|------|----|------|
| `--font-serif` | Noto Serif TC | 主標題、引言、chapter heading |
| `--font-sans` | Noto Sans TC | body text、表單、說明文字 |
| `--font-display` | Cormorant Garamond | 裝飾性數字、italic 引言標點 |
| `--font-mono` | JetBrains Mono | chapter tag（`CHAPTER 02 ·`）、技術標籤 |

**字型配對邏輯**：Cormorant Garamond（西文 display serif）搭配 Noto Serif TC（中文 serif），視覺語言統一而不衝突。Mono 只用於「索引感」的場合，避免過度技術感。

### 字型比例（fluid）

```css
--text-display-xl: clamp(28px, 7.2vw, 60px)   /* hero H1 */
--text-display-lg: clamp(26px, 6.5vw, 46px)   /* chapter H2 */
--text-display-md: clamp(24px, 6vw, 40px)
--text-h2:         clamp(24px, 5.5vw, 44px)
--text-h3:         clamp(19px, 4vw, 26px)
--text-body-lg:    clamp(15px, 2.8vw, 17px)
--text-eyebrow:    10.5px                       /* 固定小，不縮放 */
--text-mono-sm:    10px
```

### 動畫曲線

| 變數 | Cubic-bezier | 用途 |
|------|-------------|------|
| `--ease-reveal` | `0.22, 1, 0.36, 1` | scroll reveal（快出慢收） |
| `--ease-in-out` | `0.32, 0.72, 0.32, 1` | hover、transition |
| `--duration-fast` | `0.22s` | hover feedback |
| `--duration-reveal` | `0.8s` | reveal on scroll |

---

## Layer 2 — Primitives (`css/primitives.css`)

中性佈局積木，不帶章節特定的顏色或造型偏好。

| Class | 用途 |
|-------|------|
| `.reveal` | opacity 0 → 1，translateY 20px → 0，由 IntersectionObserver 觸發 |
| `.corner-orn` | 四角金色細線裝飾（`::before` / `::after`） |
| `.h-scroll` | 手機橫向 scroll-snap，桌面轉 grid |
| `.pull-quote` | 章節收束引言殼（ch02 pain outro 使用） |
| `.photo-ph` | 開發時的佔位背景（production 不顯示） |

**原則**：primitives 裡不出現 `background-color`、字型設定、或任何與品牌直接相關的值。顏色全從 tokens 變數引入。

---

## Layer 3 — Chapter Art Direction

每章有自己獨立的視覺語言。下方是各章設計決策摘要。

---

### Ch01 — Hero (`css/chapters/ch01-hero.css`)

**情緒**：希望感、方向感、不是「問題頁」。

**佈局**：全幅照片（`100dvh`），照片佔滿，文字左對齊下方。桌面改為左半遮罩 + 右半透明，讓照片呼吸。

**視覺手法**：
- 主角照片：真實家庭場景（非模特兒感）
- 遮罩：手機版垂直漸層（上透明 → 下深），桌面版橫向漸層（左深 → 右透明）
- CTA：圓角全寬（手機）/ 固定寬 pill（桌面），金色底 + 深色字
- 副標：`text-gold-300` 強調「低負擔、可累積」
- scroll indicator：白色細線向下，桌面版才顯示

**不做**：不加 hero 區塊的卡片，不在照片上疊 badge 或 tag grid。

---

### Ch02 — Pain Points (`css/chapters/ch02-pain.css`)

**情緒**：共鳴感、「說出了我的心聲」的辨識，不是恐嚇。

**佈局**：全幅深色照片床（`.pain-bed`），照片在後方撐開視覺，內容疊在上方。

**視覺手法**：
- 背景：桌面辦公照 + 深色漸層遮罩
- 圖片說明（`.pain-bed-cap`）：旋轉 90° 垂直文字，右側裝飾標籤
- Accordion（`.acc-list`）：scroll-driven 開展，每個 item 有金色 dot + 編號
- 收束引言（`.pain-outro`）：pull-quote 元件，暖奶白底，Cormorant italic 引號

**動效**：
- 頁面捲動到 40% viewport 高度時，accordion item 自動開展
- 手動點擊可強制切換

**不做**：不用「卡片列表」呈現五個痛點，不加 icon grid。

---

### Ch03 — Vice Industry Comparison (`css/chapters/ch03-compare.css`)

**情緒**：冷靜評估感，「我讓你自己判斷」，不是恐嚇其他選項。

**佈局**：分兩段——
1. **ch03b（上段）**：深藍夜空底 + pill tabs 切換評估卡。
2. **ch03-bridge-block（下段）**：更深的 `#071F3D` 深海軍藍，作為過渡段落。

**視覺手法（ch03b）**：
- 背景：深藍漸層 + grain 紋理 + 右上角 radial glow
- 標籤頁：pill button，active 狀態金色底
- 評估卡（`.ch03b-eval`）：`corner-orn` 四角裝飾，評估結果分「表面」/「轉折」/「現實」三段
- 轉折：水平線 + 「但」字，視覺上製造「反轉」節奏
- 箭頭導航 + counter：桌面輔助導航

**視覺手法（bridge block）**：
- 植物插圖：純 SVG 金線葉脈，`opacity: 0.9`，裝飾性
- 三條 roman numeral 原則列（i / ii / iii）
- 過渡文字：引導讀者往 ch04 前進

**動效**：
- pill tab 切換：`compare.js` 控制 content 淡入淡出
- 箭頭 / swipe 導航同步更新 pill 狀態

---

### Ch04 — Health Market (`css/chapters/ch04-market.css`)

**情緒**：「這就在你身邊」的親近感，不是市場數據報告感。

**底圖**：`images/health-couple-daily.jpg`
一對中年夫妻在木紋餐桌旁一起看手機。畫面色彩——木桌琥珀暖色、女士奶白毛衣、男士藏青外套——與品牌色彩幾乎完全吻合。桌面大片前景提供天然文字落點。

**佈局**：
1. **Hero** — 全幅底圖，文字疊在左下方（木桌區）
2. **Intro Bridge** — 一句 Cormorant italic 引言，連接 hero 敘事與通訊錄
3. **Contacts Panel** — 仿通訊錄介面，editorial magazine 索引感
4. **Close Block** — 深海軍藍區塊，大字 Cormorant italic，自然銜接 ch05

**Hero 遮罩策略**：
- 手機：垂直漸層（透明 → 奶白 `#F4F0E4`，從 60% 到底部），讓照片上方清晰、下方淡出，文字在淡出區排列
- 桌面：橫向漸層（左側奶白 0.97 → 透明，到 50%）+ 局部上下淡出，文字在左側，人物在右側完整呼吸

**Intro Bridge**：
- Eyebrow mono 標籤：`你的通訊錄裡，藏著最真實的市場需求`
- Display serif italic：`他們不是在找健康，他們早已開始需要了。`
- 作用：彌補 hero 文字和通訊錄 UI 之間的敘事跳躍

**Contacts Panel 原則**：
- 零卡片感：`border-radius: 0`，移除 `box-shadow`，移除 `::before`/`::after` 裝飾
- 只用上下 `border` 作為區域界定（金色 hairline）
- Search bar 保留但樣式化為裝飾性元素（italic placeholder，不可互動）
- chip tabs + scroll-driven expand 邏輯不變

**Close Block**：
- 背景：純 `#071F3D`，不做漸層（intentional hard edge，editorial feel）
- 頂部：1px 金色 hairline（`::after` pseudo）
- Ghost numeral `04`：Cormorant italic 90px，`rgba(198,154,74,0.14)`，視覺錨點
- Main quote：Cormorant italic，`clamp(26px, 5.2vw, 48px)`，奶白色
- Quote 文字：「不是趨勢報告，而是昨天、今天、明天，都在你身邊真實發生的事。」
- NEXT arrow：小 mono 標籤 + 圓形箭頭按鈕，hover 有位移動效

**不做**：不用 icon cards 列出健康需求，不用「市場規模 XX 億」的數字 showcase，收束區不加 `✦` 裝飾符號（太弱）。

---

### Ch05 — Trust / Cooperation Advantages (`css/chapters/ch05-trust.css`)

**情緒**：「我懂你的顧慮」的接納感，不是「我們多厲害」的說服感。

**佈局**：
1. 全幅照片 head（家庭 / 餐桌場景）
2. 引言 bridge
3. 雙欄：左側引言 + 右側 concern accordion

**視覺手法**：
- 照片 head：同 ch01 佔滿寬度，底部漸出
- Accordion（`.concern-card`）：每張展開前顯示「你可能擔心 / 星耀提供」摘要
- 展開內容：concern-divider（水平線 + 箭頭 + 標籤）+ 解決方案標題 + 說明
- scroll-driven：捲動到 65% trigger 時自動開展最近的 card

**不做**：不用「打勾 + 條列優勢」的格式，不放公司簡介文字牆。

---

### Ch06 — Real Cases (`css/chapters/ch06-cases.css`)

**情緒**：「跟我一樣的人，已經走在路上了」的真實感。

**佈局**：三組 `ch06-stage`，每組：
- 左（桌面）/ 上（手機）：全版人物照（`.ch06-photo`）
- 右（桌面）/ 下（手機）：故事卡（`.ch06-card`）

**視覺手法**：
- 人物照：全版照，`object-fit: cover`，深色漸層疊在上方
- 照片上的文字：chapter tag + 標題 + story progress dots
- 故事卡背景：`#10243A` 局部深藍，非全白
- 結果數字：`ch06-result-row`，標籤 + 分隔符 + 數值
- 人物引言（`blockquote`）：左側金色細線，serif italic
- 下一案例 preview：card 底部，含縮圖 + 姓名 + teaser

**局部 CSS 變數**：ch06 使用 `--c-navy: #10243A`、`--c-gold: #B98B3A` 在 chapter 層級 override，與其他章節的色票微調分離。

**免責聲明**：每個案例底部都有 `ch06-disclaimer` 小字，收在設計裡不突兀但合規。

---

### Ch07 — CTA Form (`css/chapters/ch07-cta.css`)

**情緒**：「這是一個安全的決定」的安心感，降低填表心理阻力。

**佈局**：
1. 全幅家庭早餐照 hero
2. 指南封面展示（`.ch07-cover`）
3. 三個 key points
4. 表單卡（`.ch07-form-card`）

**視覺手法**：
- Hero：明亮自然光照，與前幾章的深色形成對比，象徵「看到出路」
- 指南封面：陰影 + 左傾 `rotate(-2deg)`，增加書本真實感
- 表單卡：`#FBF7EE` 暖奶白底，非純白，呼應品牌暖調
- 安全聲明（`.ch07-release`）：表單欄位之前，降低個資疑慮
- Submit button：深海軍藍底 + 金色文字 + 箭頭，與 hero CTA 一致

**不做**：不在表單旁放「倒數計時」或「名額有限」的製造焦慮元素。

---

## 跨章節共通規則

### Section 轉場節奏

```
ch01 — 暗（深夜海軍藍照片）
ch02 — 暗（黑白/深色辦公場景）
ch03 — 暗（深藍）→ 更暗（bridge）
ch04 — 亮（奶白 + 日常場景）
ch05 — 暗入亮（照片 → 奶白 accordion）
ch06 — 暗（深藍卡片 + 人物照）
ch07 — 亮（明亮家庭早餐）
```

暗 → 亮 → 暗 → 亮 的交替節奏讓視覺有呼吸感，避免長頁面的疲乏感。

### Eyebrow 標籤規則

所有章節 eyebrow 格式統一：
```
CHAPTER 0X · 中文章節名稱
```
使用 `--font-mono`，`letter-spacing: 0.28em`，金色。dot 裝飾在文字前。

### 圖片規格建議

| 使用場景 | 建議尺寸 | 格式 |
|----------|----------|------|
| Hero / chapter 全版照 | 1600 × 1200px 以上 | jpg（品質 85） |
| 人物 / 案例照 | 900 × 1200px（直版） | jpg |
| 指南封面 | 600 × 800px | jpg / png |
| Logo mark | 120 × 120px | png（透明底） |
| 健康場景縮圖（contacts） | 300 × 300px | jpg |

所有圖片加 `loading="lazy"`，hero 照片不加（優先載入）。

---

## 未來修改指引

**新增一個 section**：
1. 在 `css/chapters/` 建立新的 CSS 檔案
2. 決定這章的「背景色溫」（接在哪章後面，節奏上是暗還是亮？）
3. 避免直接套用其他章節的 class，從 tokens + primitives 重新組合
4. 在本文件的 Layer 3 新增該章的 Art Direction 段落

**調整品牌色**：
1. 只改 `css/tokens.css` 裡的變數值
2. 不要在 chapter CSS 裡 hard-code 顏色值（應全部使用 `var(--c-*)`）

**加新的 JS 互動**：
1. 根據功能歸屬建立或修改對應的 `js/` 模組
2. 保持每個模組的 IIFE 封裝（`(function(){...})()`），避免全域污染
