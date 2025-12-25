# JSHope E-Commerce Backend API

Backend API untuk JSHope E-Commerce dengan integrasi Midtrans Payment Gateway.

## Tech Stack
- Node.js + Express.js
- MongoDB (Mongoose)
- Midtrans Payment Gateway
- JWT Authentication

## Environment Variables

Buat file `.env` dengan variabel berikut:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-db
JWT_SECRET=your_jwt_secret_here

# Midtrans
MIDTRANS_SERVER_KEY=Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxx
MIDTRANS_MERCHANT_ID=G123456789
MIDTRANS_IS_PRODUCTION=false
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Documentation

Lihat file `API_DOCUMENTATION.md` untuk dokumentasi lengkap.

## Deploy to Render.com

1. Push ke GitHub
2. Connect repo di Render.com
3. Set Environment Variables di Render Dashboard
4. Deploy!
