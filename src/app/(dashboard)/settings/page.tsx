"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "@/components/ui/toaster";
import { User, Lock, Info, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveName = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);
    try {
      const db = createClient();
      const { error } = await db.from("profiles").update({ name: name.trim() }).eq("id", profile.id);
      if (error) throw error;
      toast.success("Nama berhasil diperbarui");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    setChangingPw(true);
    try {
      const db = createClient();
      const { error } = await db.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Password berhasil diubah");
      setOldPw(""); setNewPw("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Pengaturan</h1>
        <p className="text-xs text-muted-foreground">Kelola profil dan preferensi</p>
      </div>

      {/* Profile Section */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Profil</h3>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border">
          <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center text-white text-xl font-bold shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{profile?.name || "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role || "member"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-11 px-4 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || name === profile?.name}
              className="px-5 h-11 rounded-xl gradient-accent text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-4 h-4 text-amber" />
          <h3 className="text-sm font-semibold text-foreground">Ubah Password</h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password Baru</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground text-sm placeholder:text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changingPw || !newPw}
            className="px-5 h-11 rounded-xl bg-amber-dim text-amber text-sm font-semibold disabled:opacity-50 hover:bg-amber/20 transition-all flex items-center gap-2"
          >
            {changingPw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Ubah Password
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Tentang Aplikasi</h3>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span>Nama</span>
            <span className="font-medium text-foreground">HanFin Project</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span>Versi</span>
            <span className="font-mono text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span>Stack</span>
            <span className="font-mono text-foreground">Next.js + Supabase</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Build</span>
            <span className="font-mono text-foreground">2026.05</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { if (confirm("Keluar dari HanFin?")) signOut(); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-dim text-red text-sm font-semibold hover:bg-red/20 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Keluar
      </button>
    </motion.div>
  );
}
