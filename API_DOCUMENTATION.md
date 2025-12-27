# API Documentation - JSHope E-Commerce Backend

Dokumentasi penggunaan API e-commerce JSHope By Jelita Rahma

## Base URL

**Production:**
```
https://jshope-backend-phs3.vercel.app/jshope
```

**Development:**
```
http://localhost:5000/jshope
```

---

## Daftar Isi

1. [Authentication](#authentication)
2. [Auth Endpoints](#auth-endpoints)
3. [Products](#products)
4. [Categories](#categories)
5. [Cart](#cart)
6. [Orders - Customer](#orders-customer)
7. [Orders - Admin](#orders-admin)
8. [Midtrans Payment](#midtrans-payment)
9. [API Summary](#api-summary)

---

## Authentication

Header untuk endpoint yang memerlukan autentikasi:

```
Authorization: Bearer <token>
```

### Role System

| Role | Deskripsi |
|------|-----------|
| customer | User biasa yang dapat berbelanja |
| admin | Administrator dengan akses penuh |

---

## Auth Endpoints

### 1. Register User

Mendaftarkan user baru.

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/auth/register |
| Auth | Tidak diperlukan |
| Access | Public |

**Request Body:**

```json
{
  "username": "string (required, unique)",
  "email": "string (required, unique)",
  "password": "string (required)",
  "role": "string (optional, default: customer)"
}
```

**Success Response (201):**

```json
{
  "message": "Register success",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

### 2. Login User

Login dan mendapatkan JWT token.

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/auth/login |
| Auth | Tidak diperlukan |
| Access | Public |

**Request Body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**

```json
{
  "message": "Login success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

## Products

### 1. Get All Products

Mengambil semua produk dengan filter dan pagination.

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/product |
| Auth | Tidak diperlukan |
| Access | Public |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Nomor halaman |
| limit | number | 10 | Jumlah item per halaman |
| category | string | - | Filter berdasarkan category ID |
| search | string | - | Pencarian berdasarkan nama produk |
| minPrice | number | - | Harga minimum |
| maxPrice | number | - | Harga maksimum |

---

### 2. Get Product by ID

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/product/:id |
| Auth | Tidak diperlukan |
| Access | Public |

---

### 3. Create Product (Admin Only)

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/product |
| Auth | Required (Admin) |
| Access | Admin Only |
| Content-Type | multipart/form-data |

**Request Body (form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✅ | Nama produk |
| category_id | ObjectId | ✅ | ID kategori |
| variants | JSON string | ✅ | Array varian produk (lihat struktur di bawah) |
| description | string | ❌ | Deskripsi produk lengkap |
| short_description | string | ❌ | Deskripsi singkat |
| product_images | file[] | ❌ | File gambar produk utama |
| variant_{index}_images | file[] | ❌ | File gambar per variant (contoh: `variant_0_images`, `variant_1_images`) |
| video | file | ❌ | File video produk |
| thumbnail_url | string | ❌ | URL thumbnail eksternal (alternatif upload) |
| image_urls | JSON string | ❌ | Array URL gambar eksternal (alternatif upload) |
| video_url | string | ❌ | URL video eksternal (alternatif upload) |

**Struktur Variants (JSON Array):**

Setiap variant harus memiliki struktur berikut:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sku | string | ❌ | SKU unik (auto-generated jika kosong: `SLUG-001`) |
| attributes | object | ✅ | Object key-value untuk atribut variant |
| price | number | ✅ | Harga variant |
| stock | number | ✅ | Stok variant |
| weight | number | ❌ | Berat dalam gram |

**Contoh Request (form-data):**

```
name: "Kaos Polos Premium"
category_id: "675a1234567890abcdef1234"
description: "Kaos polos berbahan cotton combed 30s, nyaman dan adem"
short_description: "Kaos cotton combed 30s"
variants: [
  {
    "sku": "KAOS-POLOS-001",
    "attributes": {
      "warna": "Hitam",
      "ukuran": "M"
    },
    "price": 85000,
    "stock": 50,
    "weight": 200
  },
  {
    "sku": "KAOS-POLOS-002",
    "attributes": {
      "warna": "Hitam",
      "ukuran": "L"
    },
    "price": 89000,
    "stock": 40,
    "weight": 220
  },
  {
    "attributes": {
      "warna": "Putih",
      "ukuran": "M"
    },
    "price": 85000,
    "stock": 30,
    "weight": 200
  }
]
product_images: [file1.jpg, file2.jpg]
variant_0_images: [variant0_img1.jpg]
variant_1_images: [variant1_img1.jpg]
```

**Catatan Gambar & Video:**
- Untuk gambar, pilih salah satu: **upload file** ATAU **kirim URL eksternal**
- Di lokal: bisa upload file langsung
- Di Vercel: gunakan URL eksternal (Cloudinary, ImgBB, dll)
- Gambar pertama akan otomatis jadi thumbnail (is_primary: true)

**Success Response (201):**

```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "675b1234567890abcdef5678",
    "name": "Kaos Polos Premium",
    "slug": "kaos-polos-premium",
    "description": "Kaos polos berbahan cotton combed 30s...",
    "short_description": "Kaos cotton combed 30s",
    "category_id": "675a1234567890abcdef1234",
    "status": "active",
    "price_min": 85000,
    "price_max": 89000,
    "total_stock": 120,
    "variant_count": 3,
    "thumbnail": "/uploads/product_images-xxx.jpg",
    "createdAt": "2024-12-25T10:00:00.000Z",
    "updatedAt": "2024-12-25T10:00:00.000Z"
  },
  "variants": [
    {
      "_id": "675c1111111111111111",
      "product_id": "675b1234567890abcdef5678",
      "sku": "KAOS-POLOS-001",
      "attributes": { "warna": "Hitam", "ukuran": "M" },
      "price": 85000,
      "stock": 50,
      "weight": 200,
      "is_active": true
    }
  ],
  "images": [
    {
      "product_id": "675b1234567890abcdef5678",
      "variant_id": null,
      "image_url": "/uploads/product_images-xxx.jpg",
      "is_primary": true,
      "sort_order": 0
    }
  ],
  "video_uploaded": false,
  "used_external_urls": false
}
```

---


### 4. Update Product (Admin Only)

| Property | Value |
|----------|-------|
| Method | PUT |
| URL | /jshope/product/:id |
| Auth | Required (Admin) |
| Access | Admin Only |
| Content-Type | multipart/form-data |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | ObjectId | ID produk yang akan diupdate |

**Request Body (form-data):**

Semua field bersifat opsional. Hanya kirim field yang ingin diubah.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Nama produk baru (slug akan di-regenerate) |
| description | string | Deskripsi produk |
| short_description | string | Deskripsi singkat |
| category_id | ObjectId | ID kategori baru |
| variants | JSON string | Array varian baru (⚠️ akan menghapus semua variant lama!) |
| product_images | file[] | File gambar produk baru |
| variant_{index}_images | file[] | File gambar per variant |
| video | file | File video produk |

**Struktur Variants (JSON Array):**

Sama seperti Create Product:

```json
[
  {
    "sku": "KAOS-POLOS-001",
    "attributes": {
      "warna": "Hitam",
      "ukuran": "M"
    },
    "price": 90000,
    "stock": 60,
    "weight": 200
  }
]
```

> ⚠️ **Perhatian:** Jika mengirim field `variants`, semua variant lama akan **dihapus** dan diganti dengan yang baru!

**Success Response (200):**

```json
{
  "message": "Product updated",
  "product": {
    "_id": "675b1234567890abcdef5678",
    "name": "Kaos Polos Premium V2",
    "slug": "kaos-polos-premium-v2",
    "description": "Deskripsi baru...",
    "category_id": "675a1234567890abcdef1234",
    "status": "active",
    "price_min": 90000,
    "price_max": 95000,
    "total_stock": 100,
    "variant_count": 2
  }
}
```

---

### 5. Delete Product (Admin Only)

| Property | Value |
|----------|-------|
| Method | DELETE |
| URL | /jshope/product/:id |
| Auth | Required (Admin) |
| Access | Admin Only |

---

## Categories

### 1. Get All Categories

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/categories |
| Auth | Tidak diperlukan |
| Access | Public |

---

### 2. Get Category by ID

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/categories/:id |
| Auth | Tidak diperlukan |
| Access | Public |

---

### 3. Create Category (Admin Only)

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/categories |
| Auth | Required (Admin) |
| Access | Admin Only |

**Request Body:**

```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

---

### 4. Update Category (Admin Only)

| Property | Value |
|----------|-------|
| Method | PUT |
| URL | /jshope/categories/:id |
| Auth | Required (Admin) |
| Access | Admin Only |

---

### 5. Delete Category (Admin Only)

| Property | Value |
|----------|-------|
| Method | DELETE |
| URL | /jshope/categories/:id |
| Auth | Required (Admin) |
| Access | Admin Only |

---

## Cart

Semua endpoint cart memerlukan autentikasi customer.

### 1. Get Cart

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/cart |
| Auth | Required |
| Access | Customer |

---

### 2. Add to Cart

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/cart/add |
| Auth | Required |
| Access | Customer |

**Request Body:**

```json
{
  "variant_id": "ObjectId (required)",
  "quantity": "number (default: 1)"
}
```

---

### 3. Increase Quantity

| Property | Value |
|----------|-------|
| Method | PATCH |
| URL | /jshope/cart/:id/increase |
| Auth | Required |
| Access | Customer |

---

### 4. Decrease Quantity

| Property | Value |
|----------|-------|
| Method | PATCH |
| URL | /jshope/cart/:id/decrease |
| Auth | Required |
| Access | Customer |

---

### 5. Toggle Checked

| Property | Value |
|----------|-------|
| Method | PATCH |
| URL | /jshope/cart/:id/toggle-checked |
| Auth | Required |
| Access | Customer |

---

### 6. Remove from Cart

| Property | Value |
|----------|-------|
| Method | DELETE |
| URL | /jshope/cart/:id |
| Auth | Required |
| Access | Customer |

---

## Orders (Customer)

### 1. Get My Orders

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/orders |
| Auth | Required |
| Access | Customer |

---

### 2. Get Checkout Review

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/orders/review |
| Auth | Required |
| Access | Customer |

---

### 3. Get Order by ID

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/orders/:id |
| Auth | Required |
| Access | Customer |

---

### 4. Checkout

Membuat order baru. Jika payment_method bukan "cod", akan mengembalikan snap_token untuk pembayaran Midtrans.

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/orders/checkout |
| Auth | Required |
| Access | Customer |

**Request Body:**

```json
{
  "shipping_address": "string (required)",
  "shipping_method": "string (required)",
  "shipping_cost": "number (required)",
  "payment_method": "string (required)",
  "note": "string (optional)"
}
```

**Success Response (201):**

```json
{
  "message": "Order created",
  "order": {
    "_id": "order_id",
    "order_number": "ORD-20241225-0001",
    "total_amount": 165000,
    "status": "pending",
    "payment_status": "unpaid",
    "snap_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "snap_redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
  },
  "snap_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "snap_redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
}
```

---

### 5. Pay Order (Manual)

| Property | Value |
|----------|-------|
| Method | PATCH |
| URL | /jshope/orders/:id/pay |
| Auth | Required |
| Access | Customer |

---

### 6. Cancel Order

| Property | Value |
|----------|-------|
| Method | PATCH |
| URL | /jshope/orders/:id/cancel |
| Auth | Required |
| Access | Customer |

---

## Orders (Admin)

### 1. Get All Orders

Mengambil semua pesanan dengan filter dan pagination.

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/orders/admin/all |
| Auth | Required (Admin) |
| Access | Admin Only |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by status |
| payment_status | string | - | Filter by payment status |
| page | number | 1 | Nomor halaman |
| limit | number | 10 | Jumlah per halaman |
| sort | string | -createdAt | Sorting field |

---

### 2. Get Order Detail (Admin)

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/orders/admin/:id |
| Auth | Required (Admin) |
| Access | Admin Only |

---

### 3. Update Order Status

| Property | Value |
|----------|-------|
| Method | PATCH |
| URL | /jshope/orders/admin/:id/status |
| Auth | Required (Admin) |
| Access | Admin Only |

**Request Body:**

```json
{
  "status": "string (optional)",
  "payment_status": "string (optional)"
}
```

**Valid Values:**

| Field | Values |
|-------|--------|
| status | pending, processing, shipped, delivered, cancelled |
| payment_status | unpaid, paid, failed, refunded |

---

## Midtrans Payment

### 1. Get Client Key

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/midtrans/client-key |
| Auth | Tidak diperlukan |
| Access | Public |

**Success Response (200):**

```json
{
  "client_key": "Mid-client-xxxxx",
  "is_production": false
}
```

---

### 2. Payment Notification (Webhook)

Endpoint untuk menerima notifikasi pembayaran dari Midtrans.

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/midtrans/notification |
| Auth | Signature verification |
| Access | Midtrans Server Only |

Note: Endpoint ini dipanggil oleh server Midtrans, bukan frontend.

---

### 3. Check Transaction Status

| Property | Value |
|----------|-------|
| Method | GET |
| URL | /jshope/midtrans/status/:orderNumber |
| Auth | Required |
| Access | Customer (own order) / Admin (any order) |

---

### 4. Cancel Transaction (Admin Only)

| Property | Value |
|----------|-------|
| Method | POST |
| URL | /jshope/midtrans/cancel/:orderNumber |
| Auth | Required (Admin) |
| Access | Admin Only |

---

## Midtrans Dashboard Setup

Konfigurasi yang perlu dilakukan di Midtrans Dashboard:

1. Payment Notification URL:
   ```
   https://jshope-backend-phs3.vercel.app/jshope/midtrans/notification
   ```

2. Enabled Payment Methods:
   - Bank Transfer (Virtual Account)
   - E-Wallet (GoPay, ShopeePay, DANA, OVO)
   - QRIS
   - Kartu Kredit/Debit
   - Convenience Store

---

## API Summary

### Admin Only Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /jshope/product | Create product |
| PUT | /jshope/product/:id | Update product |
| DELETE | /jshope/product/:id | Delete product |
| POST | /jshope/categories | Create category |
| PUT | /jshope/categories/:id | Update category |
| DELETE | /jshope/categories/:id | Delete category |
| GET | /jshope/orders/admin/all | Get all orders |
| GET | /jshope/orders/admin/:id | Get order detail |
| PATCH | /jshope/orders/admin/:id/status | Update order status |
| POST | /jshope/midtrans/cancel/:orderNumber | Cancel transaction |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /jshope/cart | Get cart |
| POST | /jshope/cart/add | Add to cart |
| PATCH | /jshope/cart/:id/increase | Increase quantity |
| PATCH | /jshope/cart/:id/decrease | Decrease quantity |
| PATCH | /jshope/cart/:id/toggle-checked | Toggle checked |
| DELETE | /jshope/cart/:id | Remove from cart |
| GET | /jshope/orders | Get orders |
| GET | /jshope/orders/review | Checkout review |
| GET | /jshope/orders/:id | Order detail |
| POST | /jshope/orders/checkout | Create order |
| PATCH | /jshope/orders/:id/pay | Pay order |
| PATCH | /jshope/orders/:id/cancel | Cancel order |
| GET | /jshope/midtrans/status/:orderNumber | Check payment status |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /jshope/auth/register | Register |
| POST | /jshope/auth/login | Login |
| GET | /jshope/product | Get all products |
| GET | /jshope/product/:id | Get product detail |
| GET | /jshope/categories | Get all categories |
| GET | /jshope/categories/:id | Get category detail |
| GET | /jshope/midtrans/client-key | Get Midtrans client key |

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## File Upload

| Type | Allowed Extensions | Max Size |
|------|-------------------|----------|
| Image | jpg, jpeg, png, gif, webp | 10MB |
| Video | mp4, mov, avi, mkv, webm | 200MB |

---
