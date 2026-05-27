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
cd ~/hanfin-project
git pull
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