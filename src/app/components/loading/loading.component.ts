import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-wrapper" [class.overlay]="overlay">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <p *ngIf="message" class="loading-msg">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;

      &.overlay {
        position: fixed;
        inset: 0;
        background: rgba(13,27,42,.45);
        backdrop-filter: blur(4px);
        z-index: 500;
      }
    }

    .spinner {
      border: 3px solid var(--border);
      border-top-color: var(--teal);
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .loading-msg {
      color: var(--text-secondary);
      font-size: .875rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingComponent {
  @Input() size = 40;
  @Input() message = '';
  @Input() overlay = false;
}
