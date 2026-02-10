'use client';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'geofence' | 'tracker';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  trackerId?: string;
  geofenceId?: string;
}

const STORAGE_KEY = 'geotracker_notifications';

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Storage full or unavailable
  }
}

export function addNotification(
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): AppNotification {
  const sanitizedTitle = notification.title.replace(/<[^>]*>/g, '');
  const sanitizedMessage = notification.message.replace(/<[^>]*>/g, '');
  const newNotification: AppNotification = {
    ...notification,
    title: sanitizedTitle,
    message: sanitizedMessage,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  const notifications = getNotifications();
  notifications.unshift(newNotification);
  saveNotifications(notifications);
  return newNotification;
}

export function markAsRead(id: string): void {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    saveNotifications(notifications);
  }
}

export function markAllAsRead(): void {
  const notifications = getNotifications();
  notifications.forEach((n) => (n.read = true));
  saveNotifications(notifications);
}

export function deleteNotification(id: string): void {
  const notifications = getNotifications().filter((n) => n.id !== id);
  saveNotifications(notifications);
}

export function clearAllNotifications(): void {
  saveNotifications([]);
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}
