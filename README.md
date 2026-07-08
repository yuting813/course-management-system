[English](README.md) | [繁體中文](README.zh-TW.md)

# MERN Course Management System — A Full-Stack Defensive Architecture

This project focuses on one of the hardest problems to spot in full-stack SPA development: **once authentication crosses multiple asynchronous boundaries, state consistency quietly starts to break down**. By centralizing scattered auth logic into a single source of truth, building a two-layer defense around the JWT lifecycle, and implementing systematic error isolation, the system stays predictable even when individual modules fail.

- **Live Demo**: [course.tinahu.dev](https://course.tinahu.dev/)
- **Test Accounts**:
  - Student: `demo.student@tinahu.dev` / `DemoCourse2026`
  - Instructor: instructor registration requires an invite code, available on request during an interview.

---

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/Auth-Passport.js_JWT-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)
![Joi](https://img.shields.io/badge/Validation-Joi-E44E2A?style=flat-square)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white&style=flat-square)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white&style=flat-square)

![Course Management System — Homepage Screenshot](docs/screenshot-home.png)

---

## Engineering Differentiators

This project isn't about "getting features to work" — it's aimed at the structural problems that quietly accumulate in most portfolio projects:

| Common portfolio approach                                     | This project's decision                          | Engineering rationale                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Frontend and backend each maintain their own validation logic | **Mirrored Joi schemas**                         | Blocks dirty data at the UI boundary; a single schema change propagates symmetrically to both sides |
| Permission checks scattered across UI components              | **Service-layer Adapter Pattern**                | The view layer is fully isolated from changes in the API data shape                                 |
| Reaching for Redux/Zustand by default                         | **`App.jsx` SSOT + unidirectional Props**        | At ≤3 levels of component depth, Props skip store boilerplate without sacrificing state accuracy    |
| Letting a possibly-expired token go out with a request        | **Two-layer JWT defense (pre-check + backstop)** | Saves wasted round trips; prevents the frontend from falling into an infinite 401 redirect loop     |

---

## Architecture & Engineering Decisions

### 1. State Management: Practicing SSOT While Consciously Avoiding Overengineering

**Root problem**: `currentUser` is consumed by three modules at once — the nav bar (displays identity), the login page (writes state), and the Axios interceptor (reads the token). If any one consumer holds a stale cache, the system enters a ghost state: the UI shows "logged in" while the API returns `401`.

**Decision**: Without reaching for Redux/Zustand by default, `App.jsx` is made the single global source of truth. `setCurrentUser` is only ever called in two places across the entire project: `LoginPage` (writes on login) and `Nav` (clears on logout). Every consumer receives state through props — there are no implicit subscriptions.

```jsx
// App.jsx — centralized state, enforcing unidirectional data flow via Props
const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
```

**Trade-off assessment**: At the current component depth (<3 levels) and with a focused feature set, this approach balances development speed and state accuracy well, without the overhead of store boilerplate. If the project later grows to include frequent interactions between non-parent-child components at scale, the architecture already leaves room for a smooth migration to Zustand — the state just needs to be extracted, with no need to rework existing logic.

---

### 2. Two-Layer JWT Defense: Client-Side Pre-Check and Server-Side Backstop

Token expiry has two fundamentally different failure modes. Handling both with the same strategy either wastes network round trips or leads to an uncontrollable redirect loop. This architecture handles each at the layer where it belongs:

| Defense layer                  | Scenario                               | Strategy and engineering payoff                                                                                                                                                                       |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer 1: Request pre-check** | Token `exp` has passed                 | Parsed and intercepted client-side before the request is sent, saving a wasted round trip and server-side validation load. `isTokenExpired()` builds in a 10-second buffer to account for clock skew. |
| **Layer 2: Response backstop** | Token was forcibly revoked server-side | Catches the backend's `401 Unauthorized`, triggers auto-logout and token clearing, preventing an infinite redirect loop.                                                                              |

```javascript
// axios.service.js — Layer 1: intercept before the request leaves the client
if (isTokenExpired(token)) {
  clearToken();
  window.location.href = '/login';
  return Promise.reject(new Error('Token expired')); // stop here, no invalid request sent
}
```

**Boundary design**: `isTokenExpired()` uses an asymmetric safety strategy — a malformed token (tampering) returns `true` and triggers logout (favoring security); a token missing the `exp` field returns `false` and is treated as valid (favoring fault tolerance).

---

### 3. Service-Layer Adapter Pattern: Isolating API Structural Instability

**Root problem**: The `User` shape returned by the backend isn't consistent — the login API returns a nested `{ user: { _id, role } }`, while reading from localStorage returns a flat `{ _id, role }`. Letting each UI component handle this difference on its own would scatter fragile optional-chaining (`?.`) across every call site.

**Decision**: `PermissionService` wraps this logic behind an **Adapter Pattern**. All role and permission logic passes through `normalizeUser()` before reaching the view layer — the single place in the entire project that handles this structural difference.

```javascript
// permission.service.jsx
static normalizeUser(userLike) {
  if (!userLike) return null;
  if (userLike.user && typeof userLike.user === 'object') return userLike.user; // nested shape
  if (userLike._id || userLike.id) return userLike;                              // flat shape (supports both _id and id aliasing)
  return null;
}
```

**Payoff**: If the backend's API shape changes later, the scope of the change is limited to this one method. The view layer stays completely unaware of shifts in the underlying data contract.

---

### 4. Three Structural Defensive Guarantees

**(A) Cross-Tab State Synchronization**

If a user opens two tabs and logs out in Tab A, and Tab B's auth state doesn't clear along with it, that's a genuine permission security gap. Wrapping the native `storage` event provides lightweight cross-tab state synchronization:

```javascript
// useAuthUser.jsx
window.addEventListener('storage', (e) => {
  if (e.key === 'user') {
    try {
      setRaw(e.newValue ? JSON.parse(e.newValue) : null);
    } catch {
      setRaw(null);
    } // fail-safe: corrupted JSON must not crash the hook
  }
});
```

**(B) Two-Layer Depth ErrorBoundary (Graceful Degradation)**

Error isolation uses a two-layer depth design: an outer global `<ErrorBoundary>` wraps the entire `<Routes>` as a final backstop; each lazy-loaded route is wrapped again by its own `<ErrorBoundary>`, confining the blast radius of an error to a single page:

```jsx
// App.jsx — Two-layer depth defense structure
<ErrorBoundary>
  {' '}
  {/* global final backstop */}
  <Routes>
    <ErrorBoundary fallback={<ErrorFallback />}>
      {' '}
      {/* route-level isolated guard */}
      <Suspense fallback={<PageLoader />}>
        {' '}
        {/* async chunk loading state */}
        <Page {...props} />
      </Suspense>
    </ErrorBoundary>
  </Routes>
</ErrorBoundary>
```

This confines a single module's crash within its boundary, keeping it from spreading to the rest of the app. A `ChunkLoadError` triggered by a production redeploy is isolated at the route boundary rather than bubbling up to the root.

**(C) Read/Write-Split Error Handling Strategy**

- **Read operations** (e.g. fetching a course list): the underlying catch returns an empty array `[]`, degrading gracefully and avoiding an interruption to overall rendering.
- **Write operations** (e.g. dropping or adding a course): errors are intercepted and precisely distinguished between a server rejection (`error.response`) and a network disconnect (`error.request`), always surfacing a toast — ensuring the user gets clear feedback whenever a side-effecting operation fails.

---

### 5. Frontend Performance Tuning: Critical Rendering Path Optimization

**(A) Selective Lazy Loading (Not Blanket Lazy-Loading)**

`HomePage` stays synchronously loaded to keep LCP as fast as possible. Secondary routes use `React.lazy()` for code splitting, substantially trimming the initial JS bundle size without sacrificing first-paint speed.

**(B) Below-the-Fold Deferred Loading**

`<Footer />` and other below-the-fold content are lazy-loaded at the component level, further improving TTI (time to interactive).

**(C) ChunkLoadError Fault Tolerance**

Every dynamically loaded chunk has its own `<Suspense>` skeleton transition and is wrapped in a local `<ErrorBoundary>`. When a production redeploy invalidates the cache, the result is an isolated error state rather than a blank white page.

---

## System Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (UI / AuthService)
    participant Interceptor as Axios Interceptor
    participant Backend as Backend (Passport / JWT)
    participant Database

    User->>Frontend: Submit login credentials
    Frontend->>Backend: POST /api/user/login
    Backend->>Database: Verify user
    Database-->>Backend: User exists
    Backend-->>Frontend: Return JWT token

    Frontend->>Frontend: Store token + initialize currentUser state (App.jsx SSOT)

    rect rgb(240, 248, 255)
    note right of Frontend: Role-based rendering via PermissionService
    Frontend->>Frontend: normalizeUser() -> getPermissions()
    Frontend-->>User: Render the corresponding role dashboard (instructor / student)
    end

    note over Interceptor: On every subsequent API request
    Interceptor->>Interceptor: isTokenExpired()? intercept directly
    Interceptor->>Backend: attach token in Authorization header
    Backend-->>Interceptor: 200 OK / 401 Unauthorized
    Interceptor->>Frontend: 401 -> clearToken() + redirect /login
```

---

## Technology Choices and Trade-offs

| Technology                               | Rationale (engineering considerations)                                                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React 18 + Vite 6**                    | Native ESM in place of a bundle-based ecosystem shrinks the production build to 5.02s; Concurrent Mode works well with the Suspense-based lazy-loading guard architecture.                                                           |
| **React Router v6**                      | Nested routes + Outlet cleanly separate the layout shell from page rendering logic, letting ErrorBoundary cover failing modules with fine-grained precision.                                                                         |
| **Axios (custom instance)**              | The interceptor mechanism is the key infrastructure behind the two-layer token defense; switching to native `fetch` would degrade the core interception logic into boilerplate scattered everywhere.                                 |
| **Joi (shared frontend/backend schema)** | Frontend form pre-checks and backend route guards share the same schema design, keeping data validated to a consistent standard from UI input through to database writes.                                                            |
| **Passport.js JWT**                      | The Strategy pattern decouples authentication from business logic; adding OAuth later follows the open/closed principle — existing routes wouldn't need to change.                                                                   |
| **Helmet.js**                            | Automatically injects security HTTP headers (CSP, X-Frame-Options, etc.) at very low cost.                                                                                                                                           |
| **MongoDB + Mongoose**                   | Two-way referencing between User and Course. Given the LMS's read-heavy, write-light usage pattern, this trades slightly higher write-maintenance cost for avoiding full collection scans, significantly improving read performance. |

---

## Development and Deployment Guide

### 1. Clone the project

```bash
git clone https://github.com/yuting813/course-management-system.git
cd course-management-system
```

### 2. Install dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
npm run clientinstall
```

### 3. Configure environment variables

```bash
# Create .env files in both the root and the client directory
cp .env.example .env
cd client && cp .env.example .env
```

| Variable             | Description                                       |
| -------------------- | ------------------------------------------------- |
| `MONGODB_CONNECTION` | MongoDB Atlas connection string                   |
| `JWT_SECRET`         | JWT signing secret (do not use the default value) |
| `VITE_API_BASE_URL`  | Backend API base URL for the frontend             |

### 4. Start the dev server

```bash
npm run dev   # starts both frontend and backend concurrently (nodemon + Vite)
```

### Deployment Architecture

| Layer                  | Platform      | Notes                                                       |
| ---------------------- | ------------- | ----------------------------------------------------------- |
| Frontend static assets | Vercel        | Deployed via Edge Network with automated CI/CD              |
| Backend API            | Render        | Managed Node.js runtime                                     |
| Database               | MongoDB Atlas | Managed database with IP allowlisting for baseline security |

---

## Data Model

```
users/
  { _id, username, email, password (bcrypt hash, stripped automatically by toJSON()), role, date, courses[] }
  ↕ two-way reference (ObjectId)
courses/
  { _id, title, description, price, instructor (ref User), students[] (ref User), image, createdAt }
```

**Mongoose middleware design**: `pre('save')` auto-hashes the password on creation or modification; `toJSON()` strips the `password` field from every serialized response — the password never leaves the database layer.

---

## Technical Debt and Optimization Roadmap

The current architecture prioritizes development speed and core stability. For future enterprise-scale needs, the following optimizations are planned:

1. **Controller pattern refactor**: business logic is currently coupled to routes (fat routes). Extracting it into a `controllers/` layer would improve testability and align with the single responsibility principle.

2. **Auth scheme alignment**: currently uses a custom `JWT` scheme for learning purposes. Migrating to the industry-standard `Bearer` scheme (RFC 6750) would ensure compatibility with third-party API gateways and security tooling.

3. **Centralized error handling**: routes currently use manual `try-catch`. A global error middleware paired with a custom `AppError` class would unify the JSON error response shape site-wide.

4. **Proper logging**: `console.log` is only suitable for development. Integrating a structured logging library like Winston or Pino would enable log levels and rotation for production auditing.

5. **Distributed caching layer**: every authentication currently hits the database directly. Introducing Redis as a session/user-metadata cache would meaningfully reduce DB I/O pressure under high concurrency.

---

## About the Author

With a background in procurement management, I've long carried the habit of **anticipating known failure modes** and **designing backstops for unpredictable risk**. That mental model maps directly onto software architecture:

- **Procurement compliance specs → mirrored frontend/backend schemas**: dirty data is caught at the UI boundary, not discovered later at the database layer.
- **Supplier risk tiering → two-layer JWT defense**: known risks (expired tokens) are actively blocked at the front line; unknown risks (server-side revocation) are caught by the backstop.
- **Budget ROI discipline → frontend performance tuning**: network requests and bundle size are treated as constrained resources; every byte loaded should earn its place in the critical rendering path.

To me, maintainability and predictability were never a slogan — they're built one `if (!user) return false` and one boundary `catch` block at a time.

- **Website**: [tinahu.dev](https://www.tinahu.dev/)
- **GitHub**: [yuting813](https://github.com/yuting813)
- **Email**: [tinahuu321@gmail.com](mailto:tinahuu321@gmail.com)

---

> **Educational Use Disclaimer**
> This project is solely for personal technical demonstration and learning purposes. All third-party trademarks, service names, and logos belong to their respective owners. This project involves no commercial activity and has no commercial affiliation with any third party.
