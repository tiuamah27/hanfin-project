# 🚀 HanFin Git + AI Workflow

## 📂 Masuk ke Directory Project
```bash
cd "C:\Users\tiuam\OneDrive\Documents\01. HanFin Project\HanFin Project"
```

---

## 🔥 Workflow Harian HanFin

### 1️⃣ Sebelum AI Mulai Refactor Besar
Misalnya sebelum suruh Antigravity redesign dashboard:
```bash
git add .
git commit -m "checkpoint before dashboard redesign"
git push
```

> **🎯 Tujuan:** SAVE POINT  
> Jadi kalau AI rusak → project tetap aman.

### 2️⃣ Baru Suruh AI Kerja
AI mulai ngacak-ngacak code.

### 3️⃣ Kalau Hasilnya BAGUS
Simpan hasil AI:
```bash
git add .
git commit -m "modern dashboard redesign"
git push
```

> **✅ Hasil:** Versi bagus tersimpan permanen di GitHub

### 4️⃣ Kalau AI Ngaco / Error
Balik ke save point terakhir:
```bash
git reset --hard HEAD
```

> **✅ Hasil:** Semua perubahan AI dibuang, project kembali normal.

---

## 🧪 Level Lebih Aman → Pakai Branch AI

### Buat Area Eksperimen AI
```bash
git checkout -b ai-experiment
```
> **🎯 Artinya:** AI bebas eksperimen di sandbox.

### ✅ Kalau Hasil AI Bagus
Gabungkan ke project utama:
```bash
git checkout main
git merge ai-experiment
```

### ❌ Kalau AI Ngaco Total
Hapus branch eksperimen:
```bash
git branch -D ai-experiment
```
> **✅ Hasil:** Project utama tetap bersih & aman.

### 🌳 Visual Workflow
```text
main
 └── stable production

ai-experiment
 └── tempat AI ngacak bebas
```

---

## 📜 Command Penting

### Lihat Status Git
```bash
git status
```

### Lihat History Commit
```bash
git log --oneline
```

### Pull Update Terbaru
```bash
git pull
```

### Push ke GitHub
```bash
git push
```

---

## 🛡️ Rules HanFin

*   ✅ Sebelum AI = **COMMIT**
*   ✅ Setelah hasil bagus = **COMMIT**
*   ✅ 1 fitur = **1 commit**
*   ✅ Push setelah sesi coding selesai
*   ✅ Gunakan branch untuk eksperimen besar
*   ❌ Jangan eksperimen langsung di `main`

---

## 💡 Workflow Aman
```text
Coding
 └── Commit
      └── Push
           └── AI Experiment
                └── Commit
                     └── Push
```

Kalau rusak:
```text
Rollback → Aman ✅
```