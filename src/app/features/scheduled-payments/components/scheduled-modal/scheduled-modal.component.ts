import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { ScheduledPayment, ScheduledPaymentDraft } from '../../../../core/models/scheduled-payment.model';
import { ScheduledFormComponent } from '../scheduled-form/scheduled-form.component';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-scheduled-modal',
  imports: [ScheduledFormComponent, NgIcon],
  templateUrl: './scheduled-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledModalComponent {
  private elementRef = inject(ElementRef);

  readonly editing = input<ScheduledPayment | null>(null);
  readonly isAutoPay = input(false);
  readonly submitting = input(false);

  readonly closed = output<void>();
  readonly submitted = output<ScheduledPaymentDraft>();

  constructor() {
    effect((onCleanup) => {
      const el = this.elementRef.nativeElement as HTMLElement;
      const previous = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.closed.emit();
      };
      document.addEventListener('keydown', onKey);

      const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      const trap = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !focusables.length) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      };
      document.addEventListener('keydown', trap);

      onCleanup(() => {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keydown', trap);
        document.body.style.overflow = '';
        if (previous && typeof previous.focus === 'function') previous.focus();
      });

      const first = el.querySelector<HTMLElement>('#payee') ?? focusables[0];
      if (first) first.focus();
    });
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}