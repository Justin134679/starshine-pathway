# 星耀落地頁 — Design Review 問題清單（2026-06-28）

審查方式：以手機 375px 全保真度為主（LINE 導流頁，手機是主戰場），對照 DESIGN.md 與 gstack 設計清單。寬桌面（≥768px）受預覽工具限制未完整審查。

## 總評
- 品牌識別、真實攝影、襯線敘事、海軍藍／老金／奶白三角 = 高水準、**不是 AI slop**。
- 本 session 已完成的可讀性調整解決了大部分「字太小」問題。
- 剩下的問題集中在：**固定 CTA 遮擋**、**圖上文字對比**、**極小裝飾標籤**、**生產環境技術債**。

設計分數（手機）約 B+；AI slop 分數 A。

## High（先修）
1. **固定底部 CTA 遮擋內容** — 「免費領取指南」常駐底欄在多個 section 蓋住最後一排互動元素：ch04 的 chip tab「腸胃」、ch06 數據列「17 個月後」、ch02 結尾。使用者看不到／點不到被蓋住的元素。需給對應容器 `padding-bottom` / `scroll-margin-bottom` 讓內容讓出底欄高度。
2. **圖上文字對比不足** — ch04 底部「選一個你最有感的日常需求」、chip tabs 疊在繁忙照片上；ch02 旋轉圖說等，部分低於 WCAG AA 4.5:1。需加深遮罩或加文字陰影。

## Medium
3. **標題手動空格／斷行** — hero「別讓風險都 自己扛」有一個刻意空格造成視覺缺口；多處用手動 `<br>` 斷行，在某些寬度會尷尬。建議改用 `text-wrap: balance` + 移除手動空格。
4. **極小裝飾標籤** — 大量 mono eyebrow 9.5–11px（CHAPTER tag、STORY 01 OF 03、頁尾 mono）低於 12px caption 下限。9.5px 那批尤其吃力。設計上刻意，但建議底線拉到 11–12px。
5. **觸控目標 < 44px** — chip tab（sb-ticket）高 42px、ch04 聯絡人展開鈕（toggle）30px 圓鈕，低於 44px 觸控下限。
6. **Tailwind Play CDN 生產環境** — `cdn.tailwindcss.com` 是瀏覽器端即時編譯，每次載入都重編譯（FOUC／效能風險），官方明言不建議用於正式站。建議改為 build 階段產出靜態 CSS。
7. **置中區塊與左對齊敘事不一致** — ch07「這份指南會告訴你」、ch05 sub 等少數區塊置中，與整體左對齊 editorial 風格略有出入（用得不多，影響小）。

## Polish
8. **ch06 案例一補圖灰帶** — 袁先生照片頂端補的灰底在某些情況有極淡接縫（目前被遮罩蓋住，可接受）。理想是換一張原生有頭頂留白的去背／棚拍圖。
9. **prefers-reduced-motion** — 需確認 reveal / scroll-driven accordion 有尊重「減少動態」偏好（第 4 步要加 GSAP 前一起處理）。
10. **連結 visited 狀態** — 頁尾連結無 visited 區分（合規細節）。

## Quick Wins（各 < 30 分鐘）
- 給被固定 CTA 遮擋的區塊加底部間距（#1）
- hero 標題移除多餘空格、改 text-wrap: balance（#3）
- 圖上文字加遮罩/陰影（#2）
- chip tab / toggle 觸控區補到 44px（#5）

## 未完整審查
- 寬桌面（≥768px）版面：預覽框開不到，需 gstack browse 或實機確認。
