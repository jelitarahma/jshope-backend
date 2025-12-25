# 📚 API Documentation - JSHope E-Commerce Backend

Dokumentasi lengkap untuk penggunaan API e-commerce. Semua endpoint menggunakan base URL:

```
http://localhost:5000/jshope
```

---

## 📑 Daftar Isi

- [Authentication](#-authentication)
- [Products](#-products-public--admin)
- [Categories](#-categories-public--admin)
- [Cart](#-cart-customer)
- [Orders](#-orders-customer)

---

## 🔐 Authentication

Header untuk endpoint yang memerlukan autentikasi:
```
Authorization: Bearer <token>
```

### Role System
- **customer**: User biasa yang dapat berbelanja
- **admin**: Administrator dengan akses penuh untuk mengelola produk dan kategori

---

## 👤 Auth Endpoints

### 1. Register User
Mendaftarkan user baru.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/auth/register` |
| **Auth** | ❌ Tidak diperlukan |
| **Access** | Public |

**Request Body:**
```json
{
  "username": "string (required, unique)",
  "email": "string (required, unique)",
  "password": "string (required)",
  "role": "string (optional, default: 'customer')" // "admin" atau "customer"
}
```

**Success Response (201):**
```json
{
  "message": "User created"
}
```

**Error Response (400):**
```json
{
  "error": "Error message"
}
```

---

### 2. Login User
Login untuk mendapatkan token JWT.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/auth/login` |
| **Auth** | ❌ Tidak diperlukan |
| **Access** | Public |

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "role": "customer" // atau "admin"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 📦 Products (Public + Admin)

### 1. Get All Products *(Public)*
Mengambil semua produk yang aktif.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/product` |
| **Auth** | ❌ Tidak diperlukan |
| **Access** | Public |

**Success Response (200):**
```json
[
  {
    "_id": "product_id",
    "name": "Product Name",
    "slug": "product-name",
    "description": "Full description",
    "short_description": "Short desc",
    "thumbnail": "/uploads/image.jpg",
    "price_min": 100000,
    "total_stock": 50,
    "variant_count": 3,
    "video_url": "/uploads/video.mp4",
    "category_id": {
      "_id": "category_id",
      "name": "Category Name"
    }
  }
]
```

---

### 2. Get Product by ID *(Public)*
Mengambil detail produk lengkap dengan variants dan images.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/product/:id` |
| **Auth** | ❌ Tidak diperlukan |
| **Access** | Public |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID produk |

**Success Response (200):**
```json
{
  "product": {
    "_id": "product_id",
    "name": "Product Name",
    "slug": "product-name",
    "description": "Description",
    "short_description": "Short desc",
    "thumbnail": "/uploads/image.jpg",
    "price_min": 100000,
    "price_max": 200000,
    "total_stock": 50,
    "variant_count": 3,
    "status": "active",
    "category_id": {
      "_id": "category_id",
      "name": "Category Name",
      "slug": "category-slug"
    }
  },
  "variants": [
    {
      "_id": "variant_id",
      "product_id": "product_id",
      "sku": "SKU-001",
      "attributes": {
        "color": "Red",
        "size": "L"
      },
      "price": 150000,
      "stock": 20,
      "weight": 500,
      "is_active": true
    }
  ],
  "images": [
    {
      "_id": "image_id",
      "product_id": "product_id",
      "variant_id": "variant_id",
      "image_url": "/uploads/image1.jpg",
      "is_primary": true,
      "sort_order": 0
    }
  ],
  "video_url": "/uploads/video.mp4"
}
```

**Error Response (404):**
```json
{
  "error": "Product not found"
}
```

---

### 3. Create Product *(Admin Only)*
Membuat produk baru dengan variants dan images.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/product` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |
| **Content-Type** | `multipart/form-data` |

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Nama produk |
| `description` | string | ❌ | Deskripsi lengkap |
| `short_description` | string | ❌ | Deskripsi singkat |
| `category_id` | ObjectId | ✅ | ID kategori |
| `variants` | JSON string | ✅ | Array of variant objects |
| `product_images` | File[] | ❌ | Gambar utama produk |
| `variant_0_images` | File[] | ❌ | Gambar untuk variant ke-0 |
| `variant_1_images` | File[] | ❌ | Gambar untuk variant ke-1 |
| `video` | File | ❌ | Video produk (max 200MB) |

**Variants JSON Format:**
```json
[
  {
    "sku": "SKU-001",
    "attributes": { "color": "Red", "size": "L" },
    "price": 150000,
    "stock": 20,
    "weight": 500
  },
  {
    "sku": "SKU-002",
    "attributes": { "color": "Blue", "size": "M" },
    "price": 140000,
    "stock": 15,
    "weight": 500
  }
]
```

**Success Response (201):**
```json
{
  "message": "Product created successfully",
  "product": { /* product object */ },
  "variants": [ /* array of variants */ ],
  "images": [ /* array of images */ ],
  "video_uploaded": true
}
```

**Error Response (403):**
```json
{
  "error": "Admin only"
}
```

---

### 4. Update Product *(Admin Only)*
Mengupdate produk yang sudah ada.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **URL** | `/jshope/product/:id` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |
| **Content-Type** | `multipart/form-data` |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID produk |

**Request Body:** Sama dengan Create Product (semua field optional kecuali saat update variants)

**Success Response (200):**
```json
{
  "message": "Product updated",
  "product": { /* updated product */ }
}
```

---

### 5. Delete Product *(Admin Only)*
Menghapus produk beserta variants dan images.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **URL** | `/jshope/product/:id` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID produk |

**Success Response (200):**
```json
{
  "message": "Product deleted"
}
```

---

## 🏷️ Categories (Public + Admin)

### 1. Get All Categories *(Public)*
Mengambil semua kategori.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/categories` |
| **Auth** | ❌ Tidak diperlukan |
| **Access** | Public |

**Success Response (200):**
```json
[
  {
    "_id": "category_id",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic products"
  }
]
```

---

### 2. Get Category by ID *(Public)*
Mengambil detail kategori berdasarkan ID.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/categories/:id` |
| **Auth** | ❌ Tidak diperlukan |
| **Access** | Public |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID kategori |

**Success Response (200):**
```json
{
  "_id": "category_id",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products"
}
```

---

### 3. Create Category *(Admin Only)*
Membuat kategori baru.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/categories` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "_id": "category_id",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products"
}
```

---

### 4. Update Category *(Admin Only)*
Mengupdate kategori.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **URL** | `/jshope/categories/:id` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID kategori |

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "_id": "category_id",
  "name": "Updated Name",
  "slug": "updated-name",
  "description": "Updated description"
}
```

---

### 5. Delete Category *(Admin Only)*
Menghapus kategori.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **URL** | `/jshope/categories/:id` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID kategori |

**Success Response (200):**
```json
{
  "message": "Category deleted"
}
```

---

## 🛒 Cart (Customer)

> ⚠️ **Semua endpoint Cart memerlukan autentikasi**

### 1. Get User Cart
Mengambil semua item di keranjang user yang login.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/cart` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**Success Response (200):**
```json
[
  {
    "_id": "cart_item_id",
    "user_id": "user_id",
    "variant_id": {
      "_id": "variant_id",
      "sku": "SKU-001",
      "attributes": { "color": "Red", "size": "L" },
      "price": 150000,
      "stock": 20,
      "product_id": {
        "_id": "product_id",
        "name": "Product Name",
        "slug": "product-name",
        "thumbnail": "/uploads/image.jpg"
      }
    },
    "quantity": 2,
    "is_checked": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2. Add to Cart
Menambahkan item ke keranjang.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/cart/add` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**Request Body:**
```json
{
  "variant_id": "string (required)",
  "quantity": 1 // optional, default: 1
}
```

**Success Response (201):**
```json
{
  "_id": "cart_item_id",
  "user_id": "user_id",
  "variant_id": { /* variant with product */ },
  "quantity": 1,
  "is_checked": true
}
```

**Error Response (400):**
```json
{
  "error": "Stock not enough"
}
```

---

### 3. Increase Quantity
Menambah quantity item di keranjang (+1).

| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **URL** | `/jshope/cart/:id/increase` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID cart item |

**Success Response (200):**
```json
{
  "_id": "cart_item_id",
  "quantity": 3,
  "is_checked": true
}
```

---

### 4. Decrease Quantity
Mengurangi quantity item di keranjang (-1). Jika quantity = 1, item akan dihapus.

| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **URL** | `/jshope/cart/:id/decrease` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID cart item |

**Success Response - Decreased (200):**
```json
{
  "_id": "cart_item_id",
  "quantity": 1,
  "is_checked": true
}
```

**Success Response - Removed (200):**
```json
{
  "message": "Item removed from cart (quantity reached 0)"
}
```

---

### 5. Toggle Checked Status
Toggle status checked item untuk checkout.

| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **URL** | `/jshope/cart/:id/toggle-checked` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID cart item |

**Success Response (200):**
```json
{
  "message": "Checked status toggled",
  "cartItem": { /* cart item with updated is_checked */ }
}
```

---

### 6. Remove from Cart
Menghapus item dari keranjang.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **URL** | `/jshope/cart/:id` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID cart item |

**Success Response (200):**
```json
{
  "message": "Item removed from cart"
}
```

---

## 📋 Orders (Customer)

> ⚠️ **Semua endpoint Order memerlukan autentikasi**

### 1. Get My Orders
Mengambil daftar order user yang login.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/orders` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**Success Response (200):**
```json
[
  {
    "_id": "order_id",
    "order_number": "ORD-20240101-0001",
    "total_amount": 180000,
    "status": "pending",
    "payment_status": "unpaid",
    "shipping_method": "JNE Reguler",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2. Get Order Detail
Mengambil detail order lengkap dengan items.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/orders/:id` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID order |

**Success Response (200):**
```json
{
  "order": {
    "_id": "order_id",
    "order_number": "ORD-20240101-0001",
    "total_amount": 180000,
    "subtotal_products": 150000,
    "shipping_cost": 30000,
    "shipping_address": "Jl. Example No. 123",
    "shipping_method": "JNE YES",
    "payment_method": "transfer_bank",
    "note": "Please handle with care",
    "status": "pending",
    "payment_status": "unpaid"
  },
  "items": [
    {
      "_id": "order_item_id",
      "order_id": "order_id",
      "variant_id": { /* variant with product */ },
      "product_name": "Product Name",
      "product_slug": "product-name",
      "thumbnail": "/uploads/image.jpg",
      "variant_attributes": { "color": "Red", "size": "L" },
      "quantity": 1,
      "price": 150000,
      "subtotal": 150000
    }
  ]
}
```

---

### 3. Get Checkout Review
Mengambil ringkasan checkout sebelum membuat order.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/orders/review` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**Success Response (200):**
```json
{
  "items": [
    {
      "cart_item_id": "cart_id",
      "variant_id": "variant_id",
      "product_name": "Product Name",
      "product_slug": "product-name",
      "thumbnail": "/uploads/image.jpg",
      "variant_attributes": { "color": "Red", "size": "L" },
      "quantity": 1,
      "price": 150000,
      "subtotal": 150000,
      "weight": 500
    }
  ],
  "subtotal": 150000,
  "total_weight": 500,
  "shipping_options": [
    { "method": "JNE Reguler", "cost": 15000, "estimated": "3-5 hari" },
    { "method": "JNE YES", "cost": 30000, "estimated": "1-2 hari" },
    { "method": "J&T Express", "cost": 18000, "estimated": "2-4 hari" },
    { "method": "SiCepat REG", "cost": 16000, "estimated": "3-5 hari" },
    { "method": "Gosend Instant", "cost": 25000, "estimated": "1-2 jam" }
  ],
  "payment_methods": [
    { "code": "transfer_bank", "name": "Transfer Bank (Manual Verifikasi)" },
    { "code": "ewallet", "name": "E-Wallet (GoPay, OVO, Dana, ShopeePay)" },
    { "code": "virtual_account", "name": "Virtual Account (BCA, BNI, Mandiri)" },
    { "code": "cod", "name": "Bayar di Tempat (COD)" }
  ]
}
```

---

### 4. Checkout / Create Order
Membuat order baru dari item yang dipilih di keranjang.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/orders/checkout` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**Request Body:**
```json
{
  "shipping_address": "string (required)",
  "shipping_method": "string (required)",
  "shipping_cost": 15000, // number (required)
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
    "order_number": "ORD-20240101-0001",
    "total_amount": 165000,
    "subtotal_products": 150000,
    "shipping_cost": 15000,
    "status": "pending",
    "payment_status": "unpaid"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Stock not enough for SKU-001"
}
```

---

### 5. Pay Order
Menandai order sebagai sudah dibayar.

| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **URL** | `/jshope/orders/:id/pay` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID order |

**Success Response (200):**
```json
{
  "message": "Payment successful",
  "order": {
    "_id": "order_id",
    "payment_status": "paid",
    "status": "processing"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Order already paid or cancelled"
}
```

---

### 6. Cancel Order
Membatalkan order (hanya bisa jika unpaid & pending).

| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **URL** | `/jshope/orders/:id/cancel` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID order |

**Success Response (200):**
```json
{
  "message": "Order cancelled, stock returned",
  "order": {
    "_id": "order_id",
    "status": "cancelled"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Cannot cancel paid or processed order"
}
```

---

## 📦 Admin Order Management (Admin Only)

> ⚠️ **Semua endpoint ini hanya bisa diakses oleh Admin**

### 1. Get All Orders *(Admin Only)*
Mengambil semua pesanan dari semua user dengan filter dan pagination.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/orders/admin/all` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status: `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| `payment_status` | string | - | Filter by payment: `unpaid`, `paid`, `failed`, `refunded` |
| `page` | number | 1 | Nomor halaman |
| `limit` | number | 10 | Jumlah item per halaman |
| `sort` | string | `-createdAt` | Sorting field (prefix `-` untuk descending) |

**Example Request:**
```
GET /jshope/orders/admin/all?status=pending&payment_status=unpaid&page=1&limit=10
```

**Success Response (200):**
```json
{
  "orders": [
    {
      "_id": "order_id",
      "order_number": "ORD-20240101-0001",
      "total_amount": 180000,
      "subtotal_products": 150000,
      "shipping_cost": 30000,
      "shipping_address": "Jl. Example No. 123",
      "shipping_method": "JNE Reguler",
      "payment_method": "transfer_bank",
      "status": "pending",
      "payment_status": "unpaid",
      "user_id": {
        "_id": "user_id",
        "username": "johndoe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "phone_number": "08123456789"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  },
  "statistics": {
    "total_orders": 50,
    "total_revenue": 15000000,
    "pending_count": 10,
    "processing_count": 15,
    "shipped_count": 8,
    "delivered_count": 12,
    "cancelled_count": 5,
    "unpaid_count": 10,
    "paid_count": 40
  }
}
```

---

### 2. Get Order Detail *(Admin Only)*
Mengambil detail order lengkap dari user manapun.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/orders/admin/:id` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID order |

**Success Response (200):**
```json
{
  "order": {
    "_id": "order_id",
    "order_number": "ORD-20240101-0001",
    "total_amount": 180000,
    "subtotal_products": 150000,
    "shipping_cost": 30000,
    "shipping_address": "Jl. Example No. 123",
    "shipping_method": "JNE YES",
    "payment_method": "transfer_bank",
    "note": "Please handle with care",
    "status": "pending",
    "payment_status": "unpaid",
    "user_id": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone_number": "08123456789",
      "address": "Jl. Example No. 123"
    }
  },
  "items": [
    {
      "_id": "order_item_id",
      "order_id": "order_id",
      "variant_id": { /* variant with product */ },
      "product_name": "Product Name",
      "product_slug": "product-name",
      "thumbnail": "/uploads/image.jpg",
      "variant_attributes": { "color": "Red", "size": "L" },
      "quantity": 1,
      "price": 150000,
      "subtotal": 150000
    }
  ]
}
```

---

### 3. Update Order Status *(Admin Only)*
Mengupdate status order dan/atau status pembayaran.

| Property | Value |
|----------|-------|
| **Method** | `PATCH` |
| **URL** | `/jshope/orders/admin/:id/status` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | ID order |

**Request Body:**
```json
{
  "status": "string (optional)", // pending, processing, shipped, delivered, cancelled
  "payment_status": "string (optional)" // unpaid, paid, failed, refunded
}
```

**Valid Status Values:**
| Field | Valid Values |
|-------|--------------|
| `status` | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| `payment_status` | `unpaid`, `paid`, `failed`, `refunded` |

**Success Response (200):**
```json
{
  "message": "Order updated successfully",
  "order": {
    "_id": "order_id",
    "order_number": "ORD-20240101-0001",
    "status": "shipped",
    "payment_status": "paid"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled"
}
```

> 💡 **Note**: Jika status diubah menjadi `cancelled`, stok produk akan otomatis dikembalikan.

---

## 📊 Ringkasan API per Role

### 🔴 Admin Only Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jshope/product` | Create product |
| PUT | `/jshope/product/:id` | Update product |
| DELETE | `/jshope/product/:id` | Delete product |
| POST | `/jshope/categories` | Create category |
| PUT | `/jshope/categories/:id` | Update category |
| DELETE | `/jshope/categories/:id` | Delete category |
| GET | `/jshope/orders/admin/all` | Get all orders (with stats) |
| GET | `/jshope/orders/admin/:id` | Get order detail (any user) |
| PATCH | `/jshope/orders/admin/:id/status` | Update order status |
| POST | `/jshope/midtrans/cancel/:orderNumber` | Cancel Midtrans transaction |

### 🟢 Customer Endpoints (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jshope/cart` | Get cart |
| POST | `/jshope/cart/add` | Add to cart |
| PATCH | `/jshope/cart/:id/increase` | Increase quantity |
| PATCH | `/jshope/cart/:id/decrease` | Decrease quantity |
| PATCH | `/jshope/cart/:id/toggle-checked` | Toggle checked |
| DELETE | `/jshope/cart/:id` | Remove from cart |
| GET | `/jshope/orders` | Get orders |
| GET | `/jshope/orders/review` | Checkout review |
| GET | `/jshope/orders/:id` | Order detail |
| POST | `/jshope/orders/checkout` | Create order + Snap token |
| PATCH | `/jshope/orders/:id/pay` | Pay order (manual) |
| PATCH | `/jshope/orders/:id/cancel` | Cancel order |
| GET | `/jshope/midtrans/status/:orderNumber` | Check payment status |

### 🌐 Public Endpoints (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jshope/auth/register` | Register |
| POST | `/jshope/auth/login` | Login |
| GET | `/jshope/product` | Get all products |
| GET | `/jshope/product/:id` | Get product detail |
| GET | `/jshope/categories` | Get all categories |
| GET | `/jshope/categories/:id` | Get category detail |
| GET | `/jshope/midtrans/client-key` | Get Midtrans client key |
| POST | `/jshope/midtrans/notification` | Webhook (Midtrans only) |

---

## 💳 Midtrans Payment Integration

### Overview
Integrasi dengan Midtrans Snap untuk pembayaran otomatis mendukung:
- Bank Transfer (Virtual Account)
- E-Wallet (GoPay, ShopeePay, DANA, OVO)
- QRIS
- Kartu Kredit/Debit
- Convenience Store (Alfamart, Indomaret)

### 1. Get Client Key *(Public)*
Mendapatkan Midtrans client key untuk frontend.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/midtrans/client-key` |
| **Auth** | ❌ Tidak diperlukan |

**Success Response (200):**
```json
{
  "client_key": "Mid-client-xxxxx",
  "is_production": false
}
```

---

### 2. Checkout with Midtrans
Response checkout sekarang menyertakan `snap_token` untuk pembayaran via Midtrans.

**Checkout Response untuk Online Payment:**
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

**Untuk COD (payment_method: "cod"):**
> Tidak ada snap_token, pembayaran dilakukan saat barang diterima.

---

### 3. Payment Notification Webhook *(Midtrans Server Only)*
Endpoint untuk menerima notifikasi status pembayaran dari Midtrans.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/midtrans/notification` |
| **Auth** | ❌ (Signature verification) |
| **Access** | 🔵 Midtrans Server Only |

> ⚠️ **Endpoint ini dipanggil oleh server Midtrans, bukan frontend.**

---

### 4. Check Transaction Status
Memeriksa status transaksi di Midtrans.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/jshope/midtrans/status/:orderNumber` |
| **Auth** | ✅ Required |
| **Access** | 🟢 Customer (own order) / 🔴 Admin (any order) |

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `orderNumber` | String | Nomor order (ORD-xxx) |

**Success Response (200):**
```json
{
  "order_number": "ORD-20241225-0001",
  "midtrans_status": {
    "transaction_status": "settlement",
    "payment_type": "bank_transfer",
    "va_numbers": [{"bank": "bca", "va_number": "123456789"}]
  },
  "order_status": "processing",
  "payment_status": "paid"
}
```

---

### 5. Cancel Transaction *(Admin Only)*
Membatalkan transaksi di Midtrans.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/jshope/midtrans/cancel/:orderNumber` |
| **Auth** | ✅ Required (Admin) |
| **Access** | 🔴 Admin Only |

**Success Response (200):**
```json
{
  "message": "Transaction cancelled",
  "midtrans_response": { /* Midtrans response */ },
  "order": { /* Updated order */ }
}
```

---

## 🔧 Midtrans Dashboard Setup

### Yang Perlu Diatur di Midtrans Dashboard:

1. **Notification URL (Webhook)**
   - Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com)
   - Buka **Settings** → **Configuration**
   - Set **Payment Notification URL** ke:
     ```
     https://your-domain.com/jshope/midtrans/notification
     ```
   - Untuk testing lokal, gunakan [ngrok](https://ngrok.com/):
     ```
     ngrok http 5000
     ```
     Lalu gunakan URL ngrok + `/jshope/midtrans/notification`

2. **Finish Redirect URL** (opsional)
   - Set ke halaman order sukses di frontend

3. **Enabled Payment Methods**
   - Buka **Settings** → **Snap Preferences**
   - Pilih metode pembayaran yang ingin diaktifkan

---

## 🔧 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid credentials) |
| 403 | Forbidden (admin only) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 📁 File Upload Notes

- **Allowed Image Types**: `jpg`, `jpeg`, `png`, `gif`, `webp`
- **Allowed Video Types**: `mp4`, `mov`, `avi`, `mkv`, `webm`
- **Max File Size**: 200MB (untuk video)
- **Upload Directory**: `/uploads/`

---

*Dokumentasi ini dibuat secara otomatis berdasarkan analisis kode backend.*
*Terakhir diperbarui: 25 Desember 2024 - Midtrans Integration Added*
