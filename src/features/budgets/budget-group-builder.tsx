"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCategories, useBudgetGroups, useCreateBudgetGroup } from "@/hooks";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { formatRupiahShort } from "@/lib/utils/formatters";

const ICONS = ["🏠", "📄", "💳", "👤", "💰", "🛒", "🔥", "📦", "🍔", "🚗", "🏥", "✈️"];
const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"];

export function BudgetGroupBuilderModal() {
  const { activeModal, closeModal } = useUIStore();
  const { user } = useAuth();
  const createGroup = useCreateBudgetGroup();
  
  const { data: categories } = useCategories("expense");
  const { data: budgetGroups } = useBudgetGroups();

  const isOpen = activeModal === "budget_group";

  const [mode, setMode] = useState<"new" | "edit">("new");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  
  // Group Fields
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Categories selection
  const [search, setSearch] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setMode("new");
    setSelectedGroupId("");
    setName("");
    setIcon(ICONS[0]);
    setColor(COLORS[0]);
    setAmount("");
    setIsRecurring(false);
    setNotes("");
    setSearch("");
    setSelectedCategoryIds([]);
  };

  const handleToggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!user || !name) {
      toast.error("Nama grup wajib diisi");
      return;
    }
    
    // Convert amount to number
    const numericAmount = Number(amount) || 0;
    
    try {
      if (mode === "new") {
        await createGroup.mutateAsync({
          payload: { 
            name, 
            icon, 
            color,
            amount: numericAmount,
            is_recurring: isRecurring,
            notes: notes || null,
            category_ids: selectedCategoryIds
          },
          userId: user.id
        });
        toast.success("Budget Group berhasil dibuat");
        closeModal();
      } else {
        // Edit mode (not fully implemented in hooks yet, assuming create for now or just wait)
        toast.error("Fitur edit belum tersedia");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan grup");
    }
  };

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <Modal id="budget_group" title="BUDGET GROUP BUILDER" maxWidth="2xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">Organize your categories into logical budget groups.</p>
          <button className="px-4 py-1.5 border border-amber/30 text-amber text-xs font-bold rounded flex items-center gap-2 hover:bg-amber/10 transition-colors">
            ✨ TEMPLATE KELUARGA
          </button>
        </div>

        <select 
          value={mode === "new" ? "" : selectedGroupId} 
          onChange={(e) => {
             const val = e.target.value;
             if (!val) {
               resetForm();
             } else {
               setMode("edit");
               setSelectedGroupId(val);
               const g = budgetGroups?.find(x => x.id === val);
               if (g) {
                 setName(g.name);
                 setIcon(g.icon);
                 setColor(g.color);
                 setAmount(g.amount?.toString() || "");
                 setIsRecurring(g.is_recurring || false);
                 setNotes(g.notes || "");
                 setSelectedCategoryIds(g.category_ids || []);
               }
             }
          }}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none font-bold"
        >
          <option value="">+ Buat Group Baru</option>
          {budgetGroups?.map(g => (
            <option key={g.id} value={g.id}>Edit: {g.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Categories */}
          <div className="border border-border/50 rounded-xl p-5 bg-card/30">
            <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">AVAILABLE CATEGORIES</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Cari kategori..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCategories.map(c => {
                const isSelected = selectedCategoryIds.includes(c.id);
                return (
                  <button 
                    key={c.id}
                    onClick={() => handleToggleCategory(c.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border transition-all",
                      isSelected ? "bg-primary/20 border-primary/50 text-primary" : "bg-surface border-border hover:border-primary/30 text-muted-foreground"
                    )}
                  >
                    <span>{c.icon}</span>
                    {c.name}
                  </button>
                );
              })}
              {filteredCategories.length === 0 && <p className="text-xs text-muted-foreground">Tidak ada kategori ditemukan</p>}
            </div>
          </div>

          {/* Right Column: Group Settings */}
          <div className="space-y-6">
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">NAMA GROUP</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" 
                  placeholder="Contoh: Pengeluaran Harian" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">TOTAL BUDGET (RP)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" 
                    placeholder="0" 
                  />
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isRecurring} 
                      onChange={(e) => setIsRecurring(e.target.checked)} 
                      className="rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background" 
                    />
                    <span className="text-xs font-medium text-foreground">Berulang Tiap Bulan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">CATATAN (OPSIONAL)</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-primary/50" 
                  placeholder="Catatan tambahan..." 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">PILIH ICON</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((ic) => (
                    <button 
                      key={ic} 
                      onClick={() => setIcon(ic)}
                      className={cn("w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-all", icon === ic ? "bg-primary/20 border border-primary/50" : "bg-surface border border-border hover:border-primary/30")}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">PILIH WARNA</label>
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button 
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn("w-6 h-6 rounded-full transition-transform", color === c ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Box */}
            <div className="border border-border/50 rounded-xl p-4 bg-card/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-lg" style={{ backgroundColor: `${color}20`, color: color }}>
                  {icon}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm" style={{ color: color }}>{name || "Nama Group"}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">{selectedCategoryIds.length} Categories Selected • {formatRupiahShort(Number(amount) || 0)}</p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                {selectedCategoryIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategoryIds.map(id => {
                      const c = categories?.find(x => x.id === id);
                      if (!c) return null;
                      return <span key={id} className="text-[10px] px-2 py-1 bg-surface border border-border rounded-md text-muted-foreground">{c.icon} {c.name}</span>
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada kategori dipilih.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={resetForm} className="px-5 py-2.5 bg-card border border-border text-foreground font-bold text-xs rounded-lg hover:bg-surface transition-colors">
                RESET
              </button>
              <button onClick={handleSubmit} className="px-5 py-2.5 bg-[#69f0ae] text-black font-bold text-xs rounded-lg hover:opacity-90 transition-opacity">
                SIMPAN GROUP
              </button>
            </div>

          </div>
        </div>
      </div>
    </Modal>
  );
}
