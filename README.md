# 🧺 CleanPress — Mini Laundry Order Management System

A lightweight, AI-first Laundry Order Management System built entirely with **HTML, CSS & Vanilla JavaScript** — no frameworks, no build tools, no backend required.

---

## ✅ Features Implemented

### Core Features
| Feature | Status |
|---------|--------|
| Create Order (name, phone, garments, qty, price) | ✅ Done |
| Auto-calculate total bill | ✅ Done |
| Unique Order ID generation (`CP-XXXXX`) | ✅ Done |
| Order status: RECEIVED → PROCESSING → READY → DELIVERED | ✅ Done |
| One-click status advancement | ✅ Done |
| List all orders in a table | ✅ Done |
| Filter by status | ✅ Done |
| Filter/search by customer name, phone, garment type | ✅ Done |
| Dashboard: total orders, revenue, per-status counts | ✅ Done |

### Bonus Features
| Feature | Status |
|---------|--------|
| Simple HTML/CSS/JS Frontend (no framework) | ✅ Done |
| Estimated delivery date with overdue warning | ✅ Done |
| Search by garment type | ✅ Done |
| Print / Invoice generation | ✅ Done |
| Bar charts for status & revenue breakdown | ✅ Done |
| Today's revenue metric | ✅ Done |
| Seed data on first load | ✅ Done |
| Status pipeline visual in order detail modal | ✅ Done |
| Delete orders | ✅ Done |
| Responsive design (mobile-friendly) | ✅ Done |

---

## ⚖️ Tradeoffs

### What I Skipped
- **Authentication** — Not adding login for a single-store local tool; easily addable with a password gate
- **Backend/DB** — `localStorage` covers the use case; a Node.js + SQLite upgrade would be ~2 hours
- **Edit Order** — Only status can be changed post-creation; full edit would need form re-population logic

### What I'd Improve With More Time
1. **IndexedDB / SQLite WASM** — For larger datasets without a server
2. **SMS notifications** — Twilio webhook when status → READY
3. **Export to CSV** — One-click bulk export for accounting
4. **Multi-store auth** — JWT-based login for staff roles (counter vs. manager)
5. **PWA / offline mode** — Service worker for true offline use at the store
6. **Date range analytics** — Weekly/monthly revenue charts

---

## 📸 Pages / Screens

| Page | Description |
|------|-------------|
| **Dashboard** | KPI cards, status bar chart, garment revenue breakdown, recent orders |
| **New Order** | Customer form + dynamic garment builder + live bill preview |
| **Orders** | Full table with search/filter, quick status advance, detail modal |
| **Order Modal** | Status pipeline, garment breakdown, print invoice, delete |

---

## 💡 Tech Decisions

- **Vanilla JS** — Zero-dependency, opens instantly, no build step
- **localStorage** — Persistent across page reloads, works offline
- **CSS Variables** — Consistent design tokens, easy theming
