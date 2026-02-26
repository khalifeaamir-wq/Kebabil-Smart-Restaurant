# Kebabil - Restaurant Website

## Overview
Premium restaurant website for Kebabil — a Middle Eastern & Indian fusion kebab restaurant located in Hiranandani Estate, Thane.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS v4 + Framer Motion + ShadCN UI + wouter (routing)
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Fonts**: Playfair Display (headings), Inter (body)

## Architecture
- `client/src/components/` — UI components (Hero, About, MenuSection, SignatureDishes, Experience, Contact, Navbar, OrderDialog)
- `client/src/pages/Home.tsx` — Main landing page composing all sections
- `server/routes.ts` — API routes prefixed with `/api`
- `server/storage.ts` — Database storage layer using Drizzle
- `shared/schema.ts` — Database schema (menuCategories, menuItems)
- `server/seed.ts` — Database seeder for initial menu data

## API Routes
- `GET /api/menu` — Returns all menu categories with their items
- `POST /api/menu/categories` — Create a new category
- `POST /api/menu/items` — Create a new menu item
- `PATCH /api/menu/items/:id` — Update a menu item
- `DELETE /api/menu/items/:id` — Delete a menu item

## Database Tables
- `menu_categories` — id, name, sort_order
- `menu_items` — id, category_id, name, description, price, variants[], addons[], badge, sort_order, is_active

## Contact Info
- WhatsApp: +91 96999 66770
- Location: Rosa Manhattan, Hiranandani Estate, Thane West, Maharashtra 400607
- Hours: Daily 1:00 PM - 11:00 PM

## Brand Design
- Primary: Deep Charcoal #1C1C1C
- Accent/Primary: Warm Brown #7A4E2D
- Gold: #C69C6D
- Sand: #F3E8D9
