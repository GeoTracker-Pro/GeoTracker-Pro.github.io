'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppNotification,
  getNotifications as getStoredNotifications,
  addNotification as addStoredNotification,
  markAsRead as markStoredAsRead,
  markAllAsRead as markAllStoredAsRead,
  deleteNotification as deleteStoredNotification,
  clearAllNotifications as clearStoredNotifications,
} from './notifications';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export { NotificationContext };

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(getStoredNotifications());
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification = addStoredNotification(notification);
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    markStoredAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllStoredAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    deleteStoredNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    clearStoredNotifications();
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
