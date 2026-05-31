"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCategories, useTransactions, useBudgetGroups, useBudgetItems } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { useUIStore } from "@/stores/ui-store";
import { formatRupiahShort, getMonthString, todayISO, formatDateShort } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, PieChart, ChevronDown, ChevronUp, MoreVertical, FileText } from "lucide-react";
import { useMemo, useState } from "react";

export default function BudgetPage() {
  const { budgetPeriod, setBudgetPeriod } = useFilterStore();
  const { openModal } = useUIStore();
  const { data: txns } = useTransactions(budgetPeriod);
  const { data: budgetGroupsData } = useBudgetGroups();
  const { data: categories } = useCategories("expense");
  const { data: budgetItems, isLoading } = useBudgetItems();
  const today = todayISO();

  // State to track expanded budget groups (default is collapsed)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const changePeriod = (d: number) => {
    const [y, m] = budgetPeriod.split("-").map(Number);
    const dt = new Date(y, m - 1 + d, 1);
    setBudgetPeriod(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  };

  const periodLabel = (() => {
    const [y, m] = budgetPeriod.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1));
  })();

  const { cat: spending, item: itemSpending } = useMemo(() => {
    const catMap: Record<string, number> = {};
    const itemMap: Record<string, number> = {};
    (txns || []).filter((t) => t.type === "expense").forEach((t) => {
      if (t.budget_item_id) {
        if (t.category_id) catMap[t.category_id] = (catMap[t.category_id] || 0) + Number(t.amount);
        itemMap[t.budget_item_id] = (itemMap[t.budget_item_id] || 0) + Number(t.amount);
      } else {
        const vCid = t.category_id ? `unbudgeted-${t.category_id}` : 'uncategorized';
        catMap[vCid] = (catMap[vCid] || 0) + Number(t.amount);
        itemMap[t.id] = Number(t.amount);
      }
    });
    return { cat: catMap, item: itemMap };
  }, [txns]);


  const groupedBudgets = useMemo(() => {
    const allItems = budgetItems || [];

    // Build a lookup for budget groups
    const bgLookup: Record<string, { id: string; name: string; icon: string }> = {};
    let otherExpensesGroupId = 'other-expenses-fallback';
    (budgetGroupsData || []).forEach(bg => {
      bgLookup[bg.id] = { id: bg.id, name: bg.name, icon: bg.icon };
      if (bg.name.toLowerCase() === 'other expenses' || bg.name.toLowerCase() === 'pengeluaran lain') {
         otherExpensesGroupId = bg.id;
      }
    });

    // Build a lookup for categories
    const catLookup: Record<string, { name: string; icon: string }> = {};
    (categories || []).forEach(c => {
      catLookup[c.id] = { name: c.name, icon: c.icon };
      catLookup[`unbudgeted-${c.id}`] = { name: `${c.name} (Luar Budget)`, icon: c.icon };
    });
    catLookup['uncategorized'] = { name: 'Lainnya / Tanpa Kategori', icon: '❓' };

    // Group items: group_id -> category_id -> items[]
    const groupMap: Record<string, Record<string, any[]>> = {};
    
    // Initialize groupMap with all known groups so empty groups are still rendered
    (budgetGroupsData || []).forEach(bg => {
      groupMap[bg.id] = {};
    });

    if (!groupMap[otherExpensesGroupId]) {
      groupMap[otherExpensesGroupId] = {};
      bgLookup[otherExpensesGroupId] = { id: otherExpensesGroupId, name: 'Other Expenses', icon: '📦' };
    }

    allItems.forEach(bi => {
      const gid = bi.budget_group_id || 'ungrouped';
      const cid = bi.category_id || 'uncategorized';
      if (!groupMap[gid]) groupMap[gid] = {};
      if (!groupMap[gid][cid]) groupMap[gid][cid] = [];
      groupMap[gid][cid].push(bi);
    });

    // Inject unbudgeted expenses into Other Expenses
    Object.keys(spending).forEach(key => {
      if (key.startsWith('unbudgeted-') || key === 'uncategorized') {
         if (!groupMap[otherExpensesGroupId][key]) {
            groupMap[otherExpensesGroupId][key] = [];
         }
         
         let matchedTxns = [];
         if (key === 'uncategorized') {
            matchedTxns = (txns || []).filter(t => t.type === 'expense' && !t.budget_item_id && !t.category_id);
         } else {
            const originalCid = key.replace('unbudgeted-', '');
            matchedTxns = (txns || []).filter(t => t.type === 'expense' && !t.budget_item_id && t.category_id === originalCid);
         }
         
         matchedTxns.forEach(t => {
            groupMap[otherExpensesGroupId][key].push({
               id: t.id,
               name: t.description || 'Transaksi tak bernama',
               amount: 0,
               priority: 'fleksibel',
               budget_type: 'variable',
               notes: t.notes || 'Transaksi tanpa budget item',
            });
         });
      }
    });

    // Build the final structure
    const result: { id: string; name: string; icon: string; rawGroup?: any; categories: any[] }[] = [];

    Object.entries(groupMap).forEach(([gid, catMap]) => {
      const bg = bgLookup[gid];

      const group = {
        id: gid,
        name: bg?.name || 'Uncategorized',
        icon: bg?.icon || '📦',
        rawGroup: budgetGroupsData?.find(b => b.id === gid),
        categories: [] as any[],
      };

      Object.entries(catMap).forEach(([cid, items]) => {
        const cat = catLookup[cid];
        const itemsTotal = items.reduce((sum: number, bi: any) => sum + Number(bi.amount || 0), 0);
        const catAmount = itemsTotal;

        // Urutkan items: wajib paling atas
        const sortedItems = [...items].sort((a, b) => {
          if (a.priority === 'wajib' && b.priority !== 'wajib') return -1;
          if (a.priority !== 'wajib' && b.priority === 'wajib') return 1;
          return a.name.localeCompare(b.name);
        });

        group.categories.push({
          category_id: cid,
          name: cat?.name || 'Umum',
          icon: cat?.icon || '📊',
          amount: catAmount,
          budget_id: `virtual-${cid}`,
          notes: null,
          items: sortedItems,
        });
      });

      result.push(group);
    });

    // Sort to match Excel order
    const order = [
      'Fixed Bills',
      'Utilities',
      'Anak & Bayi',
      'Household',
      'Maintenance',
      'Personal Spending',
      'Savings',
      'Anual'
    ];
    
    result.sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    if (result.every(g => g.categories.length === 0)) return [];
    return result;
  }, [budgetGroupsData, categories, budgetItems, spending]);

  const { totalBudget, totalTerpakai } = useMemo(() => {
    let budget = 0;
    let terpakai = 0;
    groupedBudgets.forEach(g => {
      g.categories.forEach(c => {
        budget += c.amount;
        terpakai += spending[c.category_id || ""] || 0;
      });
    });
    return { totalBudget: budget, totalTerpakai: terpakai };
  }, [groupedBudgets, spending]);

  const budgetTerpakaiPct = totalBudget > 0 ? (totalTerpakai / totalBudget) * 100 : (totalTerpakai > 0 ? 999 : 0);
  const sisaBudget = Math.max(0, totalBudget - totalTerpakai);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-6">
      
      {/* Left Content (Main Content) */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex-none min-h-[44px] mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold text-foreground leading-none mb-1.5">Budget</h1>
              <p className="text-xs text-muted-foreground leading-none">Anggaran per kategori</p>
            </div>
            {/* Period Nav */}
            <div className="flex items-center gap-2 bg-[#1a2235] backdrop-blur-md rounded-full p-1 border border-border/50 shadow-sm">
              <button onClick={() => changePeriod(-1)} className="p-1.5 rounded-full hover:bg-card text-muted-foreground transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-medium text-foreground w-28 text-center font-mono">{periodLabel}</span>
              <button onClick={() => changePeriod(1)} className="p-1.5 rounded-full hover:bg-card text-muted-foreground transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="space-y-8">

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : groupedBudgets.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-[100px] border border-border/50 bg-[#0a0f1c]/50">
          <PieChart className="w-12 h-12 text-[#38bdf8] mx-auto mb-4 opacity-80" />
          <p className="text-sm font-bold text-foreground">Belum ada budget</p>
          <p className="text-xs text-muted-foreground mt-1">Set anggaran untuk mengontrol pengeluaran</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedBudgets.map((group) => {
            const groupTotalBudget = group.categories.reduce((sum, c) => sum + Number(c.amount || 0), 0);
            const groupTotalSpent = group.categories.reduce((sum, c) => sum + Number(spending[c.category_id || ""] || 0), 0);
            const groupPct = groupTotalBudget > 0 ? Math.round((groupTotalSpent / groupTotalBudget) * 100) : (groupTotalSpent > 0 ? 999 : 0);
            const groupSisa = Math.max(0, groupTotalBudget - groupTotalSpent);
            const isCollapsed = !expandedGroups[group.id];

            return (
            <div key={group.id} className="glass-card border border-border/50 overflow-hidden transition-all duration-300">
              {/* Group Header */}
              <div 
                onClick={() => toggleGroup(group.id)}
                className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30 cursor-pointer hover:bg-primary/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.icon}</span>
                  <h2 className="text-base font-bold text-foreground">{group.name}</h2>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />}
                </div>
                <div className="flex items-center gap-2 sm:gap-5">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-mono text-muted-foreground">
                      {formatRupiahShort(groupTotalSpent)} / {formatRupiahShort(groupTotalBudget)}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground/80 mt-0.5">
                      sisa <span className={cn("font-bold", groupSisa > 0 ? "text-green" : "text-muted-foreground")}>{formatRupiahShort(groupSisa)}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-card" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${Math.min(groupPct, 100) * 0.88} 88`} className={cn(groupPct > 100 ? "text-red" : groupPct > 80 ? "text-amber" : "text-green")} stroke="currentColor" />
                    </svg>
                    <span className={cn("absolute text-[9px] font-bold font-mono", groupPct > 100 ? "text-red" : groupPct > 80 ? "text-amber" : "text-green")}>{groupPct === 999 ? ">100%" : `${groupPct}%`}</span>
                  </div>
                  {group.id !== 'ungrouped' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (group.rawGroup) openModal("budget_group", group.rawGroup);
                      }} 
                      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories List */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-border/20">
                  {group.categories.map((c) => {
                    const catId = c.category_id || "";
                    const actual = spending[catId] || 0;
                    const pct = c.amount > 0 ? Math.round((actual / c.amount) * 100) : (actual > 0 ? 999 : 0);
                    return (
                      <div key={c.budget_id} className="px-5 py-4">
                        {/* Category Row */}
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="text-lg shrink-0">{c.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-foreground">{c.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground">
                                  {formatRupiahShort(actual)} / {formatRupiahShort(c.amount)}
                                </span>
                                <span className={cn("text-xs font-bold font-mono w-10 text-right", pct > 100 ? "text-red" : pct > 80 ? "text-amber" : "text-green")}>{pct === 999 ? ">100%" : `${pct}%`}</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-card overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-700", pct > 100 ? "bg-red" : pct > 80 ? "bg-amber" : "bg-green")} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Budget Items */}
                        {c.items.length > 0 && (
                          <div className="ml-9 space-y-2 mt-2">
                            {c.items.map((bi: any) => {
                              const itemActual = itemSpending[bi.id] || 0;
                              const itemPct = bi.amount > 0 ? Math.round((itemActual / bi.amount) * 100) : 0;
                              const isExpanded = expandedItemId === bi.id;
                              return (
                                <div key={bi.id} className="flex flex-col">
                                  <div 
                                    className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 hover:bg-card/30 rounded-md transition-colors group cursor-pointer"
                                    onClick={() => setExpandedItemId(isExpanded ? null : bi.id)}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0 group-hover:bg-primary/50 transition-colors" />
                                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1 min-w-0 truncate">{bi.name}</span>
                                    {bi.priority && (
                                      <span className={cn("text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold shrink-0",
                                        bi.priority === 'wajib' ? "bg-red/10 text-red" : bi.priority === 'penting' ? "bg-amber/10 text-amber" : "bg-primary/10 text-primary"
                                      )}>{bi.priority}</span>
                                    )}
                                    <span className={cn("text-xs font-mono shrink-0 w-24 text-right", itemPct > 100 ? "text-red" : "text-muted-foreground")}>
                                      {formatRupiahShort(itemActual)}/{formatRupiahShort(bi.amount)}
                                    </span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedItemId(isExpanded ? null : bi.id);
                                      }} 
                                      className={cn("p-1 rounded-md transition-all", isExpanded ? "bg-surface text-primary opacity-100" : "text-muted-foreground/50 hover:text-foreground hover:bg-surface opacity-0 group-hover:opacity-100")}
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal("budget", bi);
                                      }} 
                                      className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pl-7 pr-3 py-2.5 mb-2 bg-card/20 rounded-md border border-border/30 text-[11px] text-muted-foreground flex flex-row items-center justify-start gap-3">
                                      <div className="flex gap-1.5 shrink-0">
                                        <span className="font-semibold text-foreground">Tipe:</span>
                                        <span className="uppercase">{bi.budget_type || "Variable"}</span>
                                      </div>
                                      {bi.notes && (
                                        <>
                                          <span className="text-border/80">|</span>
                                          <div className="flex gap-1.5 shrink-0 max-w-[250px]">
                                            <span className="font-semibold text-foreground">Catatan:</span>
                                            <span className="truncate" title={bi.notes}>{bi.notes}</span>
                                          </div>
                                        </>
                                      )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            );
          })}
        </div>
      )}
        </div>
      </div>

      {/* Right Content (Analytics Panel) */}
      <div className="w-full xl:w-[320px] shrink-0">
        {/* Quick Actions */}
        <div className="w-full h-[44px] mb-6 flex gap-2">
          <button onClick={() => openModal("budget")} className="flex-1 h-full flex items-center justify-center gap-1.5 rounded-xl border border-primary/50 text-primary text-xs font-bold hover:bg-primary/10 transition-all">
            <Plus className="w-3 h-3" /> Tambah Item Budget
          </button>
          <button onClick={() => openModal("budget_group")} className="flex-1 h-full flex items-center justify-center gap-1.5 rounded-xl gradient-accent text-white text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-3 h-3" /> Tambah Group Baru
          </button>
        </div>
        
        {/* Ringkasan Anggaran */}
        <div className="glass-card p-6 mb-4 border border-border/50 bg-gradient-to-b from-card to-background">
           <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-5">Ringkasan Anggaran</h3>
           
           <div className="mb-4">
             <div className="flex justify-between text-xs mb-2">
               <span className="text-muted-foreground">Budget Terpakai</span>
               <span className={cn("font-mono font-bold", budgetTerpakaiPct > 100 ? "text-red" : budgetTerpakaiPct > 80 ? "text-amber" : "text-green")}>{budgetTerpakaiPct === 999 ? ">100%" : `${budgetTerpakaiPct.toFixed(1)}%`}</span>
             </div>
             <div className="h-1.5 rounded-full bg-card overflow-hidden">
               <div className={cn("h-full transition-all duration-1000", budgetTerpakaiPct > 100 ? "bg-red shadow-[0_0_10px_rgba(244,63,94,0.5)]" : budgetTerpakaiPct > 80 ? "bg-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-green shadow-[0_0_10px_rgba(34,197,94,0.5)]")} style={{ width: `${Math.min(budgetTerpakaiPct, 100)}%` }} />
             </div>
           </div>

           <div className="space-y-3">
             <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border/50">
                <div className="text-xs text-muted-foreground">Total Budget</div>
                <div className="text-sm font-bold font-mono text-foreground">
                   {formatRupiahShort(totalBudget)}
                </div>
             </div>
             <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border/50">
                <div className="text-xs text-muted-foreground">Total Terpakai</div>
                <div className="text-sm font-bold font-mono text-foreground">
                   {formatRupiahShort(totalTerpakai)}
                </div>
             </div>
             <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border/50">
                <div className="text-xs text-muted-foreground">Sisa Budget</div>
                <div className="text-sm font-bold font-mono text-green">
                   {formatRupiahShort(sisaBudget)}
                </div>
             </div>
           </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-5 mb-4 border border-border/50">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaksi Terbaru</h3>
              <span className="text-[10px] text-primary cursor-pointer hover:underline">Lihat Semua →</span>
           </div>
           <div className="space-y-3">
             {(txns || []).slice(0, 6).map(t => (
               <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <span className="text-sm">{t.categories?.icon || "💸"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.description || t.categories?.name || "Transaksi"}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDateShort(t.date)}</p>
                  </div>
                  <div className={cn("text-[11px] font-mono font-bold whitespace-nowrap", t.type === "income" ? "text-green" : "text-red")}>
                    {t.type === "income" ? "+" : "-"}{formatRupiahShort(t.amount)}
                  </div>
               </div>
             ))}
             {(!txns || txns.length === 0) && (
               <div className="text-center py-4">
                 <p className="text-xs text-muted-foreground">Belum ada transaksi</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
