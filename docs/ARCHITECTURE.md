# Architecture diagrams

GitHub renders these diagrams directly. Reasoning and trade-offs are in [DESIGN.md](DESIGN.md).

## 1. System overview

```mermaid
flowchart LR
  HR([HR Manager]) --> UI

  subgraph Browser["Next.js UI (frontend/)"]
    UI[Employees page<br/>Insights page]
    Client["API client<br/>lib/api.ts<br/>ApiError, ValidationError"]
    UI --> Client
  end

  Client -- "JSON over HTTP<br/>(CORS: FRONTEND_ORIGINS)" --> API

  subgraph Rails["Rails API (backend/)"]
    API[Controllers<br/>thin: params, status codes, JSON]
    API --> Search[EmployeeSearch<br/>filter, search, sort, page]
    API --> Insights["Insights::Summary<br/>Insights::Breakdown<br/>Insights::Outliers"]
    API --> Model[Employee<br/>validation, soft delete]
    Insights --> Stats[Insights::Statistics<br/>min, median, avg, max]
    Insights --> Rates[CurrencyRates<br/>fixed USD reference rates]
    Search --> Model
  end

  Model --> DB[(SQLite<br/>employees)]
  Seed[Seeding::EmployeeSeeder<br/>10,000 employees, deterministic] --> DB
```

## 2. Listing employees

```mermaid
sequenceDiagram
  actor HR as HR Manager
  participant UI as EmployeesPage
  participant API as GET /api/v1/employees
  participant Q as EmployeeSearch
  participant DB as SQLite

  HR->>UI: types in search (debounced 300 ms) / picks filter / clicks sort / changes page
  UI->>API: only the params that are set
  API->>Q: permitted params
  Q->>Q: status, filters, text (LIKE escaped), whitelisted sort + id tie-break
  Q->>DB: COUNT(matches)
  Q->>DB: SELECT ... LIMIT per_page OFFSET (page-1) x per_page
  DB-->>Q: rows
  Q-->>API: records, page, per_page, total
  API-->>UI: data[] (with annual_salary_usd) + meta
  UI->>UI: ignore the response if a newer request has started
  UI-->>HR: table, total, pager
```

## 3. How insights compare pay across currencies

```mermaid
flowchart TD
  A[Active employees<br/>country, currency, annual_salary] --> B{Group by<br/>country / department /<br/>job title / seniority}
  B --> C[Convert each salary to USD<br/>CurrencyRates.to_usd]
  C --> D[Statistics: min, median, avg, max, total<br/>USD view: comparable across countries]
  B --> E{Group uses a<br/>single currency?}
  E -- yes --> F[Statistics in local currency<br/>local view]
  E -- no --> G[local = none, shown as a dash]
  D --> H[Breakdown row]
  F --> H
  G --> H
```

Outliers use the same USD values: each active person is compared with the median of peers who share
country, job title and seniority; below 0.7x or above 1.4x is flagged; groups smaller than 5 are skipped.

## 4. Data model

```mermaid
erDiagram
  EMPLOYEES {
    bigint id PK
    string full_name
    string email "unique, stored lowercase"
    string job_title
    string department
    string country
    string currency "USD EUR GBP INR CAD AUD JPY"
    integer annual_salary "whole units of currency"
    string seniority "junior mid senior lead executive"
    date hire_date
    boolean active "false = left (soft delete)"
    datetime created_at
    datetime updated_at
  }
```

Indexes: unique `email`; `(active, country)`, `(active, department)`, `(active, seniority)`,
`(active, country, job_title)`; `full_name`.
