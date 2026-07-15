# README 與專案修正計畫

## 目標

讓 README 的每項主要技術敘述都能由現有程式碼或驗證結果支持，並優先修正可能在前端工程師面試中被追問的權限、資料一致性與測試問題。

## 第一階段：必須修正

1. 將 README 的 `JWT_SECRET` 更正為實作使用的 `PASSPORT_SECRET`，並補上 `INSTRUCTOR_INVITE_CODE`。
2. 在後端的選課與退選 API 驗證 `student` 身分，不依賴前端 UI 限制。
3. 選課時同步維護 `course.students` 與 `user.courses`，使它與退選邏輯對稱。
4. 修正 README 中無法由實作支持的敘述，包括完整 SSOT、JWT 主動撤銷、Schema 自動同步、完全隔離與徹底免除 collection scan。
5. 更新 `client/README.md`，對齊 Vite 環境變數、`JWT` scheme、公開 API、實際目錄與部署方式。

## 第二階段：可驗證性

1. 移除 Vitest 誤掃描後端 Jest 測試的設定。
2. 補上 JWT 過期判斷的前端單元測試。
3. 驗收 `npm run lint`、後端 Jest、前端 Vitest 與 production build。

## 第三階段：後續優化

1. 分析 `npm audit` 的直接與間接依賴，以可回歸測試的小批次升級，不使用無審核的 `npm audit fix --force`。
2. 為 enrollment 流程增加 API integration test，覆蓋學生、講師、重複選課與退選。
3. 視部署環境決定是否以 MongoDB transaction 保護跨 document 更新。
4. 評估索引與 query plan 後，再在 README 敘述讀取效能優勢。

## 驗收條件

- README 列出的環境變數可直接完成本機設定。
- 講師直接調用選課或退選 API 會收到 `403`。
- 學生選課後，課程與使用者兩側的參照都會更新。
- README 不使用「完美」、「永遠」、「完全無感」、「徹底」等無法充分證明的絕對敘述。
- lint 無 error，前後端測試通過，production build 成功。
