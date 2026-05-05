import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, title: string, message?: string, duration = 4000): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, type, title, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(title: string, message?: string) { this.show('success', title, message); }
  error(title: string, message?: string)   { this.show('error',   title, message, 6000); }
  warning(title: string, message?: string) { this.show('warning', title, message); }
  info(title: string, message?: string)    { this.show('info',    title, message); }

  dismiss(id: string): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
