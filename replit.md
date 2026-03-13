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
- `/table/:tableNumber` — Customer ordering flow (scanned from table QR)
- `/kitchen` — Kitchen dashboard (real-time order management)

## API Routes
### Menu
- `GET /api/menu` — Returns all menu categories with items
- `POST /api/menu/categories` — Create category
- `POST /api/menu/items` — Create menu item
- `PATCH /api/menu/items/:id` — Update menu item
- `DELETE /api/menu/items/:id` — Delete menu item

### Tables & Sessions
- `GET /api/tables` — List all tables
- `POST /api/tables` — Create table
- `POST /api/table/:tableNumber/scan` — Customer scans table QR, creates/joins session

### Orders
- `POST /api/orders` — Place order (with items array)
- `GET /api/orders/active` — Get all active orders (kitchen use)
- `GET /api/orders/session/:sessionId` — Get orders for a session
- `PATCH /api/orders/:id/status` — Update order status (new → accepted → preparing → ready → served)

## WebSocket Events
- `new_order` — Broadcasted when a new order is placed
- `order_update` — Broadcasted when order status changes

## Database Tables
- `menu_categories` — id, name, sort_order, is_active
- `menu_items` — id, category_id, name, description, price, price_value, variants[], addons[], badge, image_url, type, spice_level, is_available, prep_time_minutes, sort_order, is_active
- `restaurant_tables` — id, table_number, status, active_session_id
- `dining_sessions` — id, table_id, session_code, status, opened_at, closed_at
- `orders` — id, session_id, table_id, order_number, status, subtotal, tax, total, notes, created_at, updated_at
- `order_items` — id, order_id, menu_item_id, menu_item_name, quantity, unit_price, total_price, item_note, variant

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
