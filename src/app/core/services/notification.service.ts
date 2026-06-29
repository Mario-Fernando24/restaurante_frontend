import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationType, ToastNotification } from './notification.model';

const DEFAULT_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastsSubject = new BehaviorSubject<ToastNotification[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  private nextId = 0;

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  private show(message: string, type: NotificationType): void {
    const toast: ToastNotification = {
      id: ++this.nextId,
      message,
      type,
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    setTimeout(() => this.dismiss(toast.id), DEFAULT_DURATION_MS);
  }
}
