import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let t of toastService.toasts()"
        class="toast"
        [class]="'toast-' + t.type"
        (click)="toastService.dismiss(t.id)">
        <span class="toast-icon">{{ icons[t.type] }}</span>
        <div class="toast-content">
          <strong>{{ t.title }}</strong>
          <p *ngIf="t.message">{{ t.message }}</p>
        </div>
        <button class="toast-close">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
      max-width: 380px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      background: var(--white);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      animation: slideInRight .25s ease;
      transition: transform .18s;

      &:hover { transform: translateX(-4px); }
    }

    .toast-success { border-left: 4px solid var(--teal); }
    .toast-error   { border-left: 4px solid var(--rust); }
    .toast-warning { border-left: 4px solid var(--amber); }
    .toast-info    { border-left: 4px solid #3b82f6; }

    .toast-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 1px; }

    .toast-content {
      flex: 1;
      strong { font-size: .875rem; color: var(--navy); display: block; }
      p { font-size: .8rem; color: var(--text-secondary); margin-top: 2px; }
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: .8rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    @media (max-width: 480px) {
      .toast-container { left: 16px; right: 16px; bottom: 16px; max-width: none; }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
  readonly icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️'
  };
}
