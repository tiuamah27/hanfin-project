# Workflow Update Project

## Di Lokal

```bash
git add .
git commit -m "update"
git push
```

---

## Di Server CasaOS

```bash
cd /opt/apps/hanfin
git pull
docker compose up -d --build
```

### Jika `git pull` gagal (Aborting / Conflict)
Jika ada error karena file lokal berubah di server sehingga `git pull` dibatalkan, paksa server agar identik dengan versi Github dengan menjalankan:
```bash
git fetch --all
git reset --hard origin/main
```
Pastikan update sudah berhasil masuk dengan mengecek log terakhir:
```bash
git log -n 1
```
Jika pesannya sudah sesuai (update terbaru), lanjutkan dengan build ulang:
```bash
docker compose up -d --build
```

---

# Notes

- Tidak perlu clone ulang repo
- Tidak perlu setup Docker ulang
- Tidak perlu buat container dari awal lagi
- Tinggal `git pull` lalu rebuild

---

# Final Status

✅ Docker build sukses  
✅ Next.js production build sukses  
✅ Container running  
✅ App berhasil di-deploy di CasaOS