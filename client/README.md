# Client (React + Vite) — 課程管理系統前端

> 這是 MERN Course Management System 的 React 前端。本文件專注於目前已實作的路由、身分狀態、權限呈現、API 串接與建置方式。

- **Live Demo**：[course.tinahu.dev](https://course.tinahu.dev/)
- **完整架構與後端說明**：[根目錄 README](../README.zh-TW.md)

## 技術棧

- React 18
- Vite 6
- React Router v6
- Axios
- Joi
- Vitest
- Bootstrap 5 與專案自訂 CSS

## 目前實作重點

### 路由級 Code Splitting

`HomePage` 同步載入；其他主要頁面使用 `React.lazy` 與 `Suspense` 切分 chunk。每個 lazy route 都有路由級 `ErrorBoundary`，外層再保留一個全域邊界。

### 嵌套路由與 Layout

`Layout` 透過 React Router 的 `Outlet` 共用導覽列、主內容區與 Footer，頁面路由定義集中在 `App.jsx`。

### 登入狀態與 Token 生命週期

- `App.jsx` 管理主要 UI 的 `currentUser` state。
- 登入回應 `{ token, user }` 儲存在 `localStorage`。
- Axios request interceptor 從 localStorage 讀取 Token，先檢查 JWT `exp`，再附加至 `Authorization` header。
- Axios response interceptor 統一處理非登入請求的 `401`。
- `useAuthUser` 監聽 `storage` event，同步其內部的跨頁籤狀態。

目前後端使用 Passport JWT 的自訂 `JWT` authorization scheme，Token 字串形式為 `JWT <token>`，不是 Bearer scheme。

### 語意化權限邏輯

`PermissionService` 與 `useAuthUser` 提供：

- `isInstructor` / `isStudent`
- `canCreateCourse`
- `canEnrollCourse`
- `canEditCourse`
- `canDropCourse`
- `getCourseActions`
- `getCoursesFetcher`

課程頁面的主要操作使用這些語意化方法。少數路由入口仍直接檢查 `currentUser.user.role`，後端 API 會再次執行真正的授權檢查。

## 專案結構

```text
client/src/
├── components/
│   ├── common/       # Alert、ErrorBoundary、Fallback、Loader
│   ├── course/       # 課程卡片、詳情、編輯 Modal、骨架畫面
│   ├── home/         # 首頁 Banner 與輪播內容
│   └── layout/       # Nav、Layout、Footer
├── hooks/                # useAuthUser、useFormWithJoi
├── pages/                # 路由頁面
├── services/             # Axios instance、Auth、Course、Permission services
├── styles/               # 全域與元件樣式
├── utils/                # JWT、使用者、時間與驗證工具
└── validation/schemas/   # 前端 Joi schemas
```

## API 對接表

| 方法 | Endpoint | 用途 | 後端權限 |
|---|---|---|---|
| `POST` | `/api/user/register` | 註冊 | 公開；講師需邀請碼 |
| `POST` | `/api/user/login` | 登入 | 公開 |
| `GET` | `/api/courses` | 課程清單與搜尋 | 公開 |
| `GET` | `/api/courses/instructor/:id` | 查詢講師課程 | 公開 |
| `GET` | `/api/courses/student/:id` | 查詢學生已選課程 | 公開 |
| `POST` | `/api/courses` | 建立課程 | 講師 |
| `PATCH` | `/api/courses/:id` | 編輯課程 | 課程所有者 |
| `DELETE` | `/api/courses/:id` | 刪除課程 | 課程所有者 |
| `POST` | `/api/courses/enroll/:id` | 選課 | 學生 |
| `POST` | `/api/courses/drop/:id` | 退選 | 學生 |

## 開發設定

```bash
cd client
npm install
cp .env.example .env
npm start
```

`.env` 使用 Vite 變數：

```env
VITE_API_BASE_URL=http://localhost:8080
```

Vite development server 預設於 `http://localhost:3000`，並將 `/api` proxy 到 `http://localhost:8080`。

## 測試與建置

```bash
npm test -- --run
npm run lint
npm run build
```

Vite 建置輸出至 `client/build`，以相容於後端的 Express static serving 設定。

## 部署方式

目前對外展示的架構是：

- 前端：Vercel
- 後端 API：Render
- 資料庫：MongoDB Atlas

專案也保留 Express 在 `NODE_ENV=production` 時提供 `client/build` 與 SPA catch-all route 的能力，供合併部署使用。

## 安全取捨

Token 目前儲存於 localStorage，優點是實作直接且適合此展示型專案；取捨是 Token 可能在 XSS 情境中被前端 JavaScript 讀取。若擴展為處理真實敏感資料的產品，應連同 CSRF 防護一起評估 HttpOnly、Secure cookie 方案。
