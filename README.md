# JOZZY ERP

Business Management System for **JOZZY Decoration & Accessories** — a production ERP covering authentication, inventory, POS, purchases, transfers, expenses, car wash, and reporting across multiple branches.

Production URL: `https://jozzy.clixworks.co.tz`

## Documentation

Start here before touching any code:

- [`prompt/MASTER_PROMPT.md`](prompt/MASTER_PROMPT.md) — the full product/engineering specification
- [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) — architecture decisions, phase plan, health scorecard
- [`docs/TODO.md`](docs/TODO.md) — the live task list, updated after every change
- [`docs/DATABASE_PLAN.md`](docs/DATABASE_PLAN.md) — schema plan
- [`docs/API_PLAN.md`](docs/API_PLAN.md) — REST API contract
- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) — full frontend/backend directory layout
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — record of every implemented change

## Tech Stack

**Frontend:** React + Vite, React Router DOM, Axios, React Hook Form, Framer Motion, React Icons, Chart.js + react-chartjs-2, html5-qrcode, pure CSS (no UI framework).

**Backend:** Node.js + Express, MySQL (mysql2), JWT auth, express-validator, Helmet, Multer, node-cron, Nodemailer, pdfkit, exceljs.

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

See `docs/DEPLOYMENT.md` (added in Phase 25) for production setup on the Contabo VPS.
