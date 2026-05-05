import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ScheduleService } from '../../services/schedule.service';
import { ProviderService } from '../../services/provider.service';
import { AuthService } from '../../services/auth.service';
import { AvailabilitySlotDto, AddSlotRequest } from '../../core/models/schedule.models';
import { ProviderProfileDto } from '../../core/models/provider.models';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  templateUrl: './slots.component.html',
  styleUrls: ['./slots.component.scss']
})
export class SlotsComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private providerService = inject(ProviderService);
  readonly authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  saving = signal(false);
  togglingSlotId = signal<number | null>(null);
  error = signal('');
  message = signal('');
  slots = signal<AvailabilitySlotDto[]>([]);
  provider = signal<ProviderProfileDto | null>(null);
  providerId = signal<string | null>(null);
  role = computed(() => (this.authService.user()?.role ?? 'GUEST').toUpperCase());
  isProviderMode = computed(() => this.role() === 'PROVIDER' && !this.routeProviderId());

  filterForm = this.fb.group({
    date: [this.todayStr(), Validators.required]
  });

  singleSlotForm = this.fb.group({
    date: [this.todayStr(), Validators.required],
    startTime: ['09:00', Validators.required],
    endTime: ['09:30', Validators.required],
    consultationFee: [500, [Validators.required, Validators.min(0)]]
  });

  bulkSlotForm = this.fb.group({
    date: [this.todayStr(), Validators.required],
    startTime: ['09:00', Validators.required],
    endTime: ['17:00', Validators.required],
    durationMinutes: [30, [Validators.required, Validators.min(5)]],
    consultationFee: [500, [Validators.required, Validators.min(0)]]
  });

  recurringSlotForm = this.fb.group({
    startDate: [this.todayStr(), Validators.required],
    endDate: [this.todayStr(), Validators.required],
    slotStartTime: ['09:00', Validators.required],
    slotEndTime: ['17:00', Validators.required],
    recurrence: ['Daily', Validators.required],
    price: [500, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    const idFromRoute = this.routeProviderId();
    if (idFromRoute) {
      this.providerId.set(idFromRoute);
      this.loadProvider(idFromRoute);
      this.loadAvailableSlots();
      return;
    }

    if (this.role() === 'PROVIDER') {
      this.loadOwnProviderSlots();
    }
  }

  private routeProviderId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadProvider(id: string) {
    this.providerService.getById(id).subscribe({
      next: p => this.provider.set(p),
      error: () => {}
    });
  }

  loadAvailableSlots() {
    const providerId = this.providerId();
    const date = this.filterForm.value.date;
    if (!providerId || !date) return;

    this.loading.set(true);
    this.error.set('');

    this.scheduleService.getAvailable(providerId, date).subscribe({
      next: s => { this.slots.set(s); this.loading.set(false); },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load slots.');
        this.loading.set(false);
      }
    });
  }

  loadOwnProviderSlots() {
    this.loading.set(true);
    this.error.set('');

    this.providerService.getMyProfile().subscribe({
      next: p => {
        this.provider.set(p);
        this.providerId.set(p.providerId);
        this.scheduleService.getByProvider(p.providerId).subscribe({
          next: slots => { this.slots.set(slots); this.loading.set(false); },
          error: err => { this.error.set(err.error?.message || 'Failed to load slots.'); this.loading.set(false); }
        });
      },
      error: err => { this.error.set(err.error?.message || 'Provider profile not found.'); this.loading.set(false); }
    });
  }

  addSingleSlot() {
    if (this.singleSlotForm.invalid || !this.providerId()) { this.singleSlotForm.markAllAsTouched(); return; }
    this.saveSlot({
      providerId: this.providerId()!,
      date: this.singleSlotForm.value.date!,
      startTime: this.singleSlotForm.value.startTime!,
      endTime: this.singleSlotForm.value.endTime!,
      consultationFee: Number(this.singleSlotForm.value.consultationFee),
      currency: 'INR'
    });
  }

  addBulkSlots() {
    if (this.bulkSlotForm.invalid || !this.providerId()) { this.bulkSlotForm.markAllAsTouched(); return; }
    const { date, startTime, endTime, durationMinutes, consultationFee } = this.bulkSlotForm.value;
    const slots = this.buildBulkSlots(date!, startTime!, endTime!, Number(durationMinutes), Number(consultationFee));
    if (slots.length === 0) {
      this.error.set('Bulk range must include at least one valid slot.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.scheduleService.addBulk({ slots }).subscribe({
      next: created => {
        this.message.set(`${created.length} slots added.`);
        this.saving.set(false);
        this.loadOwnProviderSlots();
      },
      error: err => { this.error.set(err.error?.message || 'Failed to add bulk slots.'); this.saving.set(false); }
    });
  }

  generateRecurringSlots() {
    if (this.recurringSlotForm.invalid || !this.providerId()) { this.recurringSlotForm.markAllAsTouched(); return; }
    const { startDate, endDate, slotStartTime, slotEndTime, recurrence, price } = this.recurringSlotForm.value;

    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.scheduleService.generateRecurring({
      providerId: this.providerId()!,
      startDate: startDate!,
      endDate: endDate!,
      slotStartTime: slotStartTime!,
      slotEndTime: slotEndTime!,
      recurrence: recurrence as 'Daily' | 'Weekly',
      price: Number(price)
    }).subscribe({
      next: created => {
        this.message.set(`${created.length} recurring slots generated.`);
        this.saving.set(false);
        this.loadOwnProviderSlots();
      },
      error: err => { this.error.set(err.error?.message || 'Failed to generate recurring slots.'); this.saving.set(false); }
    });
  }

  private saveSlot(request: AddSlotRequest) {
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.scheduleService.addSlot(request).subscribe({
      next: () => {
        this.message.set('Slot added.');
        this.saving.set(false);
        this.loadOwnProviderSlots();
      },
      error: err => { this.error.set(err.error?.message || 'Failed to add slot.'); this.saving.set(false); }
    });
  }

  private buildBulkSlots(date: string, start: string, end: string, duration: number, fee: number): AddSlotRequest[] {
    const startMinutes = this.toMinutes(start);
    const endMinutes = this.toMinutes(end);
    const slots: AddSlotRequest[] = [];
    for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
      slots.push({
        providerId: this.providerId()!,
        date,
        startTime: this.toTime(current),
        endTime: this.toTime(current + duration),
        consultationFee: fee,
        currency: 'INR'
      });
    }
    return slots;
  }

  bookSlot(slot: AvailabilitySlotDto) {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const currentUser = this.authService.user();
    const currentRole = (currentUser?.role ?? '').toUpperCase();
    if (slot.isBlocked) {
      this.error.set('This slot is blocked.');
      return;
    }

    if (currentRole === 'PROVIDER' && slot.providerId === currentUser?.providerId) {
      this.error.set('You cannot book your own slot');
      return;
    }

    this.router.navigate(['/booking', slot.slotId]);
  }

  toggleBlock(slot: AvailabilitySlotDto) {
    this.togglingSlotId.set(slot.slotId);
    this.error.set('');
    this.message.set('');

    const request$ = slot.isBlocked
      ? this.scheduleService.unblockSlot(slot.slotId)
      : this.scheduleService.blockSlot(slot.slotId);

    request$.subscribe({
      next: () => {
        const blocked = !slot.isBlocked;
        this.slots.update(list => list.map(s =>
          s.slotId === slot.slotId
            ? { ...s, isBlocked: blocked, status: blocked ? 'Blocked' as const : 'Available' as const }
            : s
        ));
        this.message.set(blocked ? 'Slot blocked.' : 'Slot unblocked.');
        this.togglingSlotId.set(null);
      },
      error: err => {
        this.error.set(err.error?.message || 'Slot update failed.');
        this.togglingSlotId.set(null);
      }
    });
  }

  formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  private toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private toTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  get dateCtrl() { return this.filterForm.get('date')!; }
}
