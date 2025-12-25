# 🚀 Panduan Deploy ke Render.com

## Langkah-langkah Deploy

### Step 1: Siapkan MongoDB Atlas (Database Cloud)

Karena Render tidak menyediakan MongoDB, Anda perlu menggunakan **MongoDB Atlas** (gratis).

1. Buka [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Buat akun / login
3. Create **New Cluster** → Pilih **FREE tier** (M0)
4. Pilih region (Singapore recommended)
5. Buat Database User:
   - Security → Database Access → Add New User
   - Username: `jshope_user`
   - Password: (buat password kuat)
6. Whitelist IP:
   - Security → Network Access → Add IP Address
   - Pilih **"Allow Access from Anywhere"** (0.0.0.0/0)
7. Get Connection String:
   - Database → Connect → Connect your application
   - Copy connection string, contoh:
   ```
   mongodb+srv://jshope_user:PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce-db?retryWrites=true&w=majority
   ```

---

### Step 2: Push ke GitHub

```bash
cd ecommerce-backend

# Initialize git (jika belum)
git init

# Add semua files
git add .

# Commit
git commit -m "Initial commit - JSHope Backend"

# Buat repo di GitHub, lalu:
git remote add origin https://github.com/USERNAME/ecommerce-backend.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy di Render.com

1. Buka [render.com](https://render.com) dan login (bisa pakai GitHub)

2. Klik **"New"** → **"Web Service"**

3. Connect GitHub repository Anda

4. Konfigurasi:
   | Setting | Value |
   |---------|-------|
   | **Name** | `jshope-backend` |
   | **Region** | Singapore (closest) |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

5. Klik **"Advanced"** → **"Add Environment Variable"**

---

### Step 4: Environment Variables di Render

Tambahkan environment variables berikut:

| Key | Value |
|-----|-------|
| `PORT` | `10000` (Render default) |
| `MONGO_URI` | `mongodb+srv://jshope_user:PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce-db` |
| `JWT_SECRET` | `jelitaRahma@Ecommerce1` (atau secret baru) |
| `MIDTRANS_SERVER_KEY` | `Mid-server-H-GEX2_zujlsa1afZJZXn2D4` |
| `MIDTRANS_CLIENT_KEY` | `Mid-client-G193UeH-ptBMGoPB` |
| `MIDTRANS_MERCHANT_ID` | `G780657540` |
| `MIDTRANS_IS_PRODUCTION` | `false` |
| `FRONTEND_URL` | `https://your-frontend.com` (opsional) |

---

### Step 5: Deploy!

1. Klik **"Create Web Service"**
2. Tunggu build selesai (3-5 menit)
3. Setelah **"Live"**, URL Anda akan seperti:
   ```
   https://jshope-backend.onrender.com
   ```

---

## 🔧 Konfigurasi Setelah Deploy

### Update Midtrans Notification URL

1. Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com)
2. Settings → Configuration
3. Set **Payment Notification URL**:
   ```
   https://jshope-backend.onrender.com/jshope/midtrans/notification
   ```

---

## ✅ Test API

```bash
# Test root
curl https://jshope-backend.onrender.com/

# Test midtrans client key
curl https://jshope-backend.onrender.com/jshope/midtrans/client-key
```

---

## ⚠️ Catatan Penting

### Free Tier Limitations
- Server akan **sleep** setelah 15 menit tidak ada request
- **Cold start** pertama kali butuh ~30 detik
- 750 jam gratis per bulan

### Agar Server Tidak Sleep (Opsional)
Gunakan service seperti [UptimeRobot](https://uptimerobot.com) untuk ping setiap 14 menit.

---

## 📁 Checklist Sebelum Deploy

- [x] `.gitignore` sudah ada (exclude node_modules, .env)
- [x] `package.json` start script pakai `node` bukan `nodemon`
- [ ] MongoDB Atlas sudah setup
- [ ] GitHub repo sudah di-push
- [ ] Environment variables sudah di-set di Render

---

*Happy Deploying! 🚀*
