export type NotificationType = 'success' | 'error' | 'info';

export interface ToastNotification {
  id: number;
  message: string;
  type: NotificationType;
}
