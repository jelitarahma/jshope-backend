# JSHope E-Commerce Backend API

Backend API untuk JSHope E-Commerce dengan integrasi Midtrans Payment Gateway.

By: Jelita Rahma

## Tech Stack

- Node.js + Express.js
- MongoDB (Mongoose)
- Midtrans Payment Gateway
- JWT Authentication

## Live Demo

API sudah online di:
```
https://jshope-backend-phs3.vercel.app
```

Contoh endpoint:
- https://jshope-backend-phs3.vercel.app/jshope/categories
- https://jshope-backend-phs3.vercel.app/jshope/product

## Cara Menjalankan di Lokal

### Prasyarat

1. Node.js v18 atau lebih baru
2. MongoDB (lokal atau MongoDB Atlas)

### Langkah-langkah

1. Clone repository:
   ```bash
   git clone https://github.com/jelitarahma/jshope-backend.git
   cd jshope-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env` di root folder dengan isi:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ecommerce-db
   JWT_SECRET=rahasia_jwt_anda
   
   # Midtrans (opsional, untuk testing payment)
   MIDTRANS_SERVER_KEY=Mid-server-xxxxx
   MIDTRANS_CLIENT_KEY=Mid-client-xxxxx
   MIDTRANS_MERCHANT_ID=G123456789
   MIDTRANS_IS_PRODUCTION=false
   ```

4. Pastikan MongoDB berjalan:
   - Jika pakai MongoDB lokal, jalankan MongoDB service
   - Atau gunakan MongoDB Atlas dengan mengubah MONGO_URI

5. Jalankan server:
   ```bash
   npm run dev
   ```

6. Akses API di:
   ```
   http://localhost:5000
   ```

## Struktur Project

```
ecommerce-backend/
├── api/                  # Vercel serverless entry
├── config/               # Konfigurasi (Midtrans)
├── Controllers/          # Logic handler
├── Middleware/           # Auth middleware
├── models/               # MongoDB schemas
├── routes/               # API routes
├── services/             # Business logic (Midtrans)
├── uploads/              # File uploads
├── app.js                # Main application
└── package.json
```

## API Documentation

Lihat file `API_DOCUMENTATION.md` untuk dokumentasi endpoint lengkap.

## Testing dengan Postman

1. Import collection dari dokumentasi
2. Gunakan endpoint Register untuk buat akun
3. Gunakan endpoint Login untuk dapat token
4. Set token di header: `Authorization: Bearer <token>`