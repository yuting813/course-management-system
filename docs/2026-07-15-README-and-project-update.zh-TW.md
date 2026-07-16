# 2026-07-15 README 與專案正確性更新筆記

## 本次更新目標

在前端工程師面試前，逐項核對 README 與程式實作，優先修正容易在深入追問時出現落差的認證、權限、資料一致性、測試與部署敘述。

## 已完成項目

### 1. README 與實作對齊

- 更新根目錄繁中與英文 README。
- 將錯誤的 `JWT_SECRET` 更正為 `PASSPORT_SECRET`。
- 補上講師註冊需要的 `INSTRUCTOR_INVITE_CODE`。
- 將「完整 SSOT」改為實際的 `App.jsx` 主 UI state + localStorage 持久化模式。
- 將「伺服器主動撤銷 JWT」更正為處理後端因過期、無效或無法驗證 Token 而回傳的 `401`。
- 說明前後端 Joi Schema 是需同步維護的鏡像實作，不是自動共用的單一 Schema。
- 將 MongoDB 效能敘述改為取捨說明，不在缺少 index 與 query plan 證據時宣稱免除 collection scan。
- 將建置時間寫成本機近期實測範圍約 5–8 秒。

### 2. 前端子專案 README 重寫

- 對齊 React 18、Vite 6、React Router v6、Axios、Joi 與 Vitest。
- 修正過期的 `REACT_APP_API_BASE_URL`，改為 `VITE_API_BASE_URL`。
- 說明目前使用自訂 `JWT` authorization scheme，而非 Bearer scheme。
- 依照實際 routes 更新 API 表與權限要求。
- 區分目前 Vercel + Render 展示部署與 Express static serving 合併部署能力。
- 補上 localStorage Token 對 XSS 的取捨與未來 HttpOnly cookie 評估方向。

### 3. 後端權限與資料一致性

- 新增 `requireStudent` middleware。
- 選課與退選 API 在後端強制檢查學生身分，講師直接呼叫 API 會收到 `403`。
- 選課時使用 `$addToSet` 同步維護 `course.students` 與 `user.courses`。
- 退選時使用 `$pull` 從兩側移除參照。
- 用 `ObjectId.equals()` 檢查是否已選課，避免依賴物件參照比較。

### 4. 測試與工具鏈

- 將根目錄 Jest 限制在 `validation/tests`，避免錯誤掃描前端 Vitest 測試。
- 將 Vitest 限制在 `client/src`，並使用 Node environment 測試純工具函式。
- 新增 JWT 單元測試，覆蓋：
  - 錯誤 Token 格式
  - 後端使用的 `JWT` scheme
  - 10 秒過期 buffer
  - 缺少 `exp` 的現有容錯行為
- 保留 Express error middleware 所需的四參數簽名，同時清除 ESLint unused-argument warning。

## 驗證結果

| 驗證項目 | 結果 |
|---|---|
| ESLint | 通過，0 errors、0 warnings |
| 後端 Jest | 1 suite、5 tests 全數通過 |
| 前端 Vitest | 1 file、4 tests 全數通過 |
| Production build | 成功，最後一次 Vite build 約 7.66 秒 |
| `git diff --check` | 通過 |

## 目前已知風險

1. 選課與退選會更新兩個 MongoDB documents，目前使用 `Promise.all` 但尚未使用 transaction，因此不宣稱已具備完整原子性。
2. 目前新增的是 JWT 工具函式單元測試，選課授權尚缺少連接測試資料庫的 API integration tests。
3. `npm audit` 仍回報根目錄 63 項與 client 22 項相依套件漏洞，本次沒有使用可能造成 breaking changes 的 `npm audit fix --force`。
4. Vite 測試與建置時仍會顯示 CJS Node API deprecation warning。
5. Browserslist 資料顯示約六個月未更新，但不影響本次 lint 通過。

## 下一步建議

### 優先 1：補選課 API integration tests

這是面試前最有價值的下一步。建議使用 Supertest 搭配可隔離的測試資料庫，覆蓋：

- 未登入選課回傳 `401`。
- 講師選課與退選回傳 `403`。
- 學生選課同時更新 Course 與 User。
- 重複選課不會建立重複參照。
- 學生退選後兩側參照均被移除。

**面試價值**：可直接證明「前端權限只負責 UX，後端才是不可繞過的授權邊界」。

### 優先 2：分析 npm audit，不盲目強制升級

先產生 production-only audit 報告，區分直接依賴、間接依賴與只存在於開發工具的風險，再以小批次升級。每批都重跑 lint、tests 與 build。

### 優先 3：評估 MongoDB transaction

若部署使用支援 transaction 的 MongoDB Atlas replica set，可將 Course 與 User 更新放入同一 session，補上雙向參照的原子性保護。

### 優先 4：收斂前端角色判斷

將 `Nav`、`EnrollPage` 與 `CreateCoursePage` 中直接的 `currentUser.user.role` 判斷逐步改為 `PermissionService` 或 `useAuthUser` 的語意化方法。這是可維護性改善，不應在 integration tests 之前優先處理。

### 優先 5：完成面試演示腳本

建議準備一段約兩分鐘的口述，依序說明：

1. 為什麼前端與後端都需要權限判斷。
2. JWT request pre-check 與 response backstop 分別處理什麼。
3. 雙向參照的讀取優點、寫入成本與 transaction 抉擇。
4. 為什麼沒有在小型專案過早引入 Redux/Zustand。

## 本次主要變更檔案

- `.env.example`
- `README.md`
- `README.zh-TW.md`
- `client/README.md`
- `client/src/utils/auth.test.js`
- `client/vite.config.js`
- `middleware/error.middleware.js`
- `package.json`
- `routes/course-route.js`
- `docs/README_AND_PROJECT_FIX_PLAN.zh-TW.md`

## 備註

- `.gitignore` 與 `.agents/` 是本次修正前已存在的使用者變更，本次沒有覆寫。
- 本次更新目前尚未 commit。
