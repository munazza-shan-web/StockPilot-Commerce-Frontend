# StockPilot Commerce Frontend

A responsive React storefront and administration interface for the existing StockPilot Commerce API.

## Features

- Live product catalog with search and category filters
- Responsive customer storefront
- Customer registration and JWT login
- API-backed shopping cart and quantity controls
- Transaction-safe checkout
- Customer order history
- Admin product create, update and delete controls
- Admin order status management
- Live inventory indicators and low-stock states
- Safe demo preview if the API or database cannot be reached

## Stack

- React
- Vite
- Modern CSS
- StockPilot TypeScript/Express/PostgreSQL API

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Run `npm run dev`.
5. Open the URL shown by Vite.

The default API is:

`https://stockpilot-commerce-api-dcke.vercel.app`

## Demo accounts

After the backend database is seeded:

- Customer: `customer@stockpilot.dev` / `DemoPass123!`
- Admin: `admin@stockpilot.dev` / `DemoPass123!`

## Deploy to Vercel

1. Create a new GitHub repository for this frontend.
2. Add the complete project folder through GitHub Desktop and push it.
3. Import that repository in Vercel.
4. Framework preset: **Vite**.
5. Add the environment variable:

   `VITE_API_BASE_URL=https://stockpilot-commerce-api-dcke.vercel.app`

6. Deploy.
7. Copy the new frontend production URL.
8. In the **StockPilot backend** Vercel project, set `CLIENT_URL` to the frontend URL.
9. Redeploy the backend after changing `CLIENT_URL`.

The final backend `CLIENT_URL` value must not end with `/` unless the backend environment already expects it that way.

## API compatibility

This frontend is aligned to the supplied StockPilot backend routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `POST/PATCH/DELETE /api/products` for Admin
- `GET /api/categories`
- `GET/POST/DELETE /api/cart`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `PATCH /api/orders/:id/status` for Admin

No database credentials, JWT secret, passwords or private environment values are included in this frontend repository.

## Author

**Munazza Shan** — Full-Stack Web Developer  
[Portfolio](https://munazza-shan-web.github.io/munazza-shan-web/) · [LinkedIn](https://www.linkedin.com/in/munazza-shan-634459438) · [GitHub](https://github.com/munazza-shan-web)
