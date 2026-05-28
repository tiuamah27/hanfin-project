import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = "system" | "comment" | "transaction" | "wallet" | "bill" | "goal" | "budget";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  time: number; // timestamp
  isNew: boolean;
  avatar?: string | null;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'isNew'>) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notif) => set((state) => {
        const newNotif: Notification = {
          ...notif,
          id: Math.random().toString(36).substring(2, 9),
          time: Date.now(),
          isNew: true,
        };
        return {
          notifications: [newNotif, ...state.notifications].slice(0, 50), // keep last 50
        };
      }),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isNew: false }))
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isNew: false } : n)
      })),
      clearAll: () => set({ notifications: [] })
    }),
    {
      name: 'hanfin-notifications', // unique name in localStorage
    }
  )
);
