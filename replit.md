# Kebabil - Restaurant Website & Smart Ordering System

## Overview
Premium restaurant website for Kebabil — a Middle Eastern & Indian fusion kebab restaurant located in Hiranandani Estate, Thane. Includes a QR-based smart ordering system with kitchen dashboard and real-time order tracking.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS v4 + Framer Motion + ShadCN UI + wouter (routing)
- **Backend**: Express.js (Node.js) + WebSocket (ws)
- **Database**: PostgreSQL with Drizzle ORM
- **Fonts**: Playfair Display (headings), Inter (body)

## Architecture
- `client/src/components/` — UI components (Hero, About, MenuSection, SignatureDishes, Experience, Contact, Navbar, OrderDialog)
- `client/src/pages/Home.tsx` — Main landing page composing all sections
- `client/src/pages/TableOrder.tsx` — Customer QR ordering page (scanned via /table/:tableNumber)
- `client/src/pages/Kitchen.tsx` — Kitchen dashboard for order management
- `client/src/lib/websocket.ts` — WebSocket client for real-time updates
- `server/routes.ts` — API routes prefixed with `/api`
- `server/storage.ts` — Database storage layer using Drizzle
- `server/websocket.ts` — WebSocket server for broadcasting order events
- `shared/schema.ts` — Database schema
- `server/seed.ts` — Database seeder for initial menu + table data

## Pages
- `/` — Landing page (main restaurant website)
- `/table/:tableNumber` — Customer ordering flow (scan QR → menu → cart → order → track → pay → exit pass)
- `/kitchen` — Kitchen dashboard (real-time order management)
- `/waiter` — Waiter dashboard (table overview, ready-to-serve alerts, table clearing)
- `/analytics` — Analytics dashboard (revenue, orders, top items, hourly trends, door access)
- `/door` — Door scanner (verify exit QR tokens at the door)
- `/qr-codes` — Printable QR codes for all tables (admin-protected, print-ready layout)
- `/admin` — Admin panel (live floor map, clickable table details with full order info, capacity management)

## Authentication
- Staff pages (kitchen, waiter, analytics, door) require admin login
- First visit to any staff page shows setup form to create the owner account
- Session-based auth with PostgreSQL session store (24h cookie)
- Roles: `owner`, `staff`
- Admin credentials stored with SHA-256 hashed passwords
- DB table: `admin_users` — id, username, password_hash, display_name, role, is_active, created_at, last_login_at

## API Routes
### Auth
- `GET /api/auth/needs-setup` — Check if first admin needs to be created
- `POST /api/auth/setup` — Create first admin account (only works when no admins exist)
- `POST /api/auth/login` — Login with username/password
- `POST /api/auth/logout` — Destroy session
- `GET /api/auth/me` — Check current auth status
### Tables & Sessions
- `GET /api/tables` — List all tables
- `POST /api/tables` — Create table
- `POST /api/table/:tableNumber/scan` — Customer scans table QR, creates/joins session

### Orders
- `POST /api/orders` — Place order (with items array)
- `GET /api/orders/active` — Get all active orders (kitchen use)
- `GET /api/orders/session/:sessionId` — Get orders for a session
- `PATCH /api/orders/:id/status` — Update order status (new → accepted → preparing → ready → served)

### Payments & Exit
- `GET /api/session/:sessionId/bill` — Get full bill for a session
- `POST /api/payments` — Create payment record
- `PATCH /api/payments/:id/complete` — Complete payment, generate exit token
- `GET /api/exit-token/:sessionId` — Get exit token for session
- `POST /api/exit-token/verify` — Verify exit token at door

### Waiter
- `GET /api/waiter/tables` — Get all tables with session/order details
- `POST /api/waiter/table/:tableId/clear` — Clear a table after guests leave

### Admin
- `PATCH /api/admin/table/:tableId` — Update table settings (capacity)

### Analytics & Door
- `GET /api/analytics/overview` — Full analytics dashboard data (summary, top items, hourly trends, payment methods, door access)
- `GET /api/door/logs` — Door access logs

## WebSocket Events
- `new_order` — Broadcasted when a new order is placed
- `order_update` — Broadcasted when order status changes
- `payment_complete` — Broadcasted when payment is completed
- `exit_verified` — Broadcasted when exit token is verified
- `table_cleared` — Broadcasted when a table is cleared

## Database Tables
- `menu_categories` — id, name, sort_order, is_active
- `menu_items` — id, category_id, name, description, price, price_value, variants[], addons[], badge, image_url, type, spice_level, is_available, prep_time_minutes, sort_order, is_active
- `restaurant_tables` — id, table_number, capacity, status, active_session_id
- `dining_sessions` — id, table_id, session_code, status, opened_at, closed_at
- `orders` — id, session_id, table_id, order_number, status, subtotal, tax, total, notes, created_at, updated_at
- `order_items` — id, order_id, menu_item_id, menu_item_name, quantity, unit_price, total_price, item_note, variant
- `payments` — id, session_id, amount, payment_method, payment_status, transaction_ref, paid_at, created_at
- `exit_tokens` — id, session_id, payment_id, token_hash, issued_at, expires_at, is_used, used_at
- `door_access_logs` — id, exit_token_id, scan_time, result, reason

## Contact Info
- Phone: +91 86696 67566
- WhatsApp: +91 86696 67566
- Instagram: @kebabil.official
- Location: Rosa Manhattan, Hiranandani Estate, Thane West, Maharashtra 400607

## Brand Design
- Primary: Deep Charcoal #1C1C1C
- Accent/Primary: Warm Brown #7A4E2D
- Gold: #C69C6D
- Sand: #F3E8D9
