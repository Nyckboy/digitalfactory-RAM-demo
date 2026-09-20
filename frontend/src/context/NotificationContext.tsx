import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { notificationService } from '../lib/notificationApi';
import type { NotificationDTO } from '../lib/notificationApi';
interface NotificationContextType {
  unreadCount: number; notifications: NotificationDTO[];
  markAsRead: (id: string) => Promise<void>; markAllAsRead: () => Promise<void>;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export function NotificationProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore(s => s.user);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const refresh = useCallback(async () => { setNotifications(user ? await notificationService.getUnread() : []); }, [user]);
  useEffect(() => {
    void refresh();
    const handler = () => { void refresh(); };
    window.addEventListener('demo:changed', handler);
    return () => window.removeEventListener('demo:changed', handler);
  }, [refresh]);
  const markAsRead = async (id: string) => { await notificationService.markAsRead(id); await refresh(); };
  const markAllAsRead = async () => { await notificationService.markAllAsRead(); await refresh(); };
  return <NotificationContext.Provider value={{ notifications, unreadCount: notifications.filter(n => !n.read).length, markAsRead, markAllAsRead }}>{children}</NotificationContext.Provider>;
}
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('NotificationProvider is required');
  return context;
};
