# 本地預覽 + API/資料庫擴充設計

日期: 2026-04-07
狀態: 已確認（待實作規劃）

## 1. 目標與範圍

### 目標
- 在本地端可隨時預覽，支援前後端一起開發。
- 現階段使用 SQLite，未來可平滑遷移到 PostgreSQL。
- 採同一個 repo 維護前端與後端，降低開發切換成本。

### 非目標（第一階段不做）
- 不先導入 migration/seed 機制。
- 不拆成多 repo 或微服務。
- 不做與目前薪資流程無關的大型重構。

## 2. 架構設計

### 專案結構
- 前端維持既有 `src/`。
- 新增 `server/` 作為 API 與資料存取層。

建議目錄：
- server/index.ts：Express 啟動點
- server/routes/：HTTP 路由
- server/services/：業務邏輯
- server/repositories/：資料存取介面與 SQLite 實作
- server/db/：SQLite 連線與 schema 初始化

### 本地開發模式
- 以一個指令同時啟動前端 Vite + 後端 Express。
- 前端呼叫 `/api/*`，由 Vite proxy 轉發到後端。
- 除錯時可分開啟動前端或後端。

## 3. 前端資料流策略（漸進式替換）

### 現況
- 目前前端主要透過本地儲存層管理資料。

### 目標
- 由 `apiClient` 統一與後端溝通，前端畫面不直接依賴本地儲存作為主資料來源。

### 過渡方式
- 啟動時先呼叫 `GET /api/bootstrap` 取得初始化資料。
- 新增/編輯/刪除資料改走 API。
- API 失敗時回傳可顯示的錯誤訊息，不做隱性 fallback，避免資料來源不一致。

## 4. API 契約（MVP）

### 健康檢查
- GET /api/health

### 初始化
- GET /api/bootstrap
  - 回傳 jobs、logs、weeklyPrices

### 工作項目
- GET /api/jobs
- POST /api/jobs
- PUT /api/jobs/:id
- DELETE /api/jobs/:id

### 工作紀錄
- GET /api/logs?weekStart=YYYY-MM-DD（可先選擇由 bootstrap 提供）
- POST /api/logs
- PUT /api/logs/:id
- DELETE /api/logs/:id

### 每週單價
- PUT /api/weekly-prices/:weekStart
  - body: { jobId, unitPrice }

### 統一回應格式
- 成功：{ data, meta? }
- 失敗：{ error: { code, message, details? } }

錯誤碼：
- VALIDATION_ERROR
- NOT_FOUND
- CONFLICT
- INTERNAL_ERROR

## 5. 資料庫設計（SQLite，第一階段）

### jobs
- id
- name
- calc_type
- unit_price
- color
- created_at
- updated_at

### logs
- id
- job_id
- date
- start_time
- end_time
- quantity
- amount
- unit_price_at_time
- created_at
- updated_at

### weekly_prices
- week_start
- job_id
- unit_price
- updated_at

## 6. PostgreSQL 遷移預留策略

- 先定義 repository 介面（例如 JobRepository、LogRepository）。
- service 層只依賴介面，不綁定 SQLite 細節。
- 後續新增 PostgreSQL adapter 時，盡量不改 service 與前端 API 呼叫。
- 欄位命名優先採 snake_case，降低跨 DB 差異。

## 7. 錯誤處理

- 後端集中錯誤中介層，統一輸出錯誤格式。
- 驗證錯誤：400 + VALIDATION_ERROR。
- 資源不存在：404 + NOT_FOUND。
- 未預期錯誤：500 + INTERNAL_ERROR。
- 前端集中在 apiClient 做錯誤映射，UI 顯示可理解訊息。

## 8. 開發命令規劃

- npm run dev：前後端一起啟動（主要日常命令）
- npm run dev:client：只啟動前端
- npm run dev:server：只啟動後端
- npm run build：前端建置（可延伸 build:server）
- npm run preview：檢查接近正式環境的前端輸出

## 9. 測試與驗收

### 最小測試集合
- API
  - GET /api/health 可用
  - POST /api/jobs 成功與驗證失敗
  - POST /api/logs 依 calcType 驗證必要欄位
- Repository
  - SQLite 寫入/讀取一致性（jobs/logs）
- 前端整合
  - apiClient 錯誤映射可正確轉為 UI 訊息

### 第一階段完成定義（DoD）
- 可用一個命令同時啟動前後端。
- 主要資料流程改走 API。
- SQLite 可持久化 jobs/logs/weekly prices。
- 基本錯誤處理與最小測試可通過。
- 保留未來遷移 PostgreSQL 的結構邊界。

## 10. 風險與對策

- 風險：第一階段不做 migration，schema 調整可能需手動處理。
- 對策：
  - 將 schema 初始化邏輯集中於單一位置。
  - 盡量維持向後相容欄位變更策略。
  - 第二階段再補 migration/seed。

## 11. 實作執行註記（2026-04-07）

- 已完成：
  - 同 repo 前後端啟動流程（`npm run dev` 同時啟動 Vite 與 Express）。
  - SQLite schema 初始化與 repository 介面分層。
  - `health/jobs/logs/bootstrap/weekly-prices` API。
  - 前端由 localStorage 主資料源改為 API bootstrap + API 寫入流程。
  - 統一 API 錯誤格式與前端錯誤映射。
  - 基本 server/client 測試與 type-check。

- 已驗證：
  - `npm run lint`
  - `npm run test`
  - `npm run dev`（可同時看到 client 與 server 啟動訊息）

- 與規格一致，無額外擴張 migration/seed 範圍。
