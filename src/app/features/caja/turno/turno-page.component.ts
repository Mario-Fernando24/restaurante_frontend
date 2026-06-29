import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { Arqueo } from '../models/arqueo.model';
import { ArqueoService } from '../services/arqueo.service';

@Component({
  selector: 'app-turno-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './turno-page.component.html',
  styleUrls: ['./turno-page.component.scss'],
})
export class TurnoPageComponent implements OnInit, OnDestroy {
  arqueo: Arqueo | null = null;
  loading = true;
  errorMessage = '';
  submitting = false;

  readonly abrirForm = this.fb.group({
    monto_apertura: ['', [Validators.required, Validators.min(0)]],
  });

  readonly cerrarForm = this.fb.group({
    monto_cierre_real: ['', [Validators.required, Validators.min(0)]],
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private arqueoService: ArqueoService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadArqueo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAbierto(): boolean {
    return this.arqueoService.isAbierto(this.arqueo);
  }

  get montoAperturaError(): string {
    const control = this.abrirForm.get('monto_apertura');
    if (!control?.touched && !control?.dirty) return '';
    if (control.hasError('required')) return 'El monto de apertura es obligatorio';
    if (control.hasError('min')) return 'El monto debe ser mayor o igual a 0';
    return '';
  }

  get montoCierreError(): string {
    const control = this.cerrarForm.get('monto_cierre_real');
    if (!control?.touched && !control?.dirty) return '';
    if (control.hasError('required')) return 'El monto de cierre es obligatorio';
    if (control.hasError('min')) return 'El monto debe ser mayor o igual a 0';
    return '';
  }

  loadArqueo(): void {
    this.loading = true;
    this.errorMessage = '';

    this.arqueoService
      .getArqueoActivo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (arqueo) => {
          this.arqueo = arqueo;
          this.loading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
  }

  submitAbrir(): void {
    if (this.abrirForm.invalid) {
      this.abrirForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.abrirForm.value.monto_apertura);
    this.submitting = true;

    this.arqueoService
      .abrirArqueo({ monto_apertura: monto })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (arqueo) => {
          this.arqueo = arqueo;
          this.abrirForm.reset();
          this.submitting = false;
          this.notification.success('Turno abierto correctamente');
        },
        error: (error: Error) => {
          this.submitting = false;
          this.notification.error(error.message);
        },
      });
  }

  submitCerrar(): void {
    if (!this.arqueo || this.cerrarForm.invalid) {
      this.cerrarForm.markAllAsTouched();
      return;
    }

    const monto = Number(this.cerrarForm.value.monto_cierre_real);
    this.submitting = true;

    this.arqueoService
      .cerrarArqueo(this.arqueo.id_arqueo, { monto_cierre_real: monto })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.arqueo = null;
          this.cerrarForm.reset();
          this.submitting = false;
          this.notification.success('Turno cerrado correctamente');
        },
        error: (error: Error) => {
          this.submitting = false;
          this.notification.error(error.message);
        },
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
