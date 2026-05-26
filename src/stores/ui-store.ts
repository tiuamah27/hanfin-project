import { create } from 'zustand';

export type ModalType = 'transaction' | 'wallet' | 'transfer' | 'bill' | 'bill_payment' | 'paylater_payment' | 'goal' | 'budget' | 'budget_group' | 'category' | 'goal_contribution' | null;

interface UIStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModal: ModalType;
  modalData: any;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  openModal: (id: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (id, data = null) => set({ activeModal: id, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
