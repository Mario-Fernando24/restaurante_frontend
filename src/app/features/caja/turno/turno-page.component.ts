import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Empresa } from '../../../core/models/empresa.model';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ROUTES } from '../../../core/routing/route-paths';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ThermalReceiptComponent } from '../../../shared/thermal/thermal-receipt.component';
import { ThermalTicket } from '../../../shared/thermal/thermal-ticket.model';
import { buildCierreTicket, printThermalTicket } from '../../../shared/thermal/thermal-ticket.util';
import { Arqueo, TurnoDetalle } from '../models/arqueo.model';
import { ArqueoService } from '../services/arqueo.service';

@Component({
  selector: 'app-turno-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputComponent,
    ThermalReceiptComponent,
  ],
  templateUrl: './turno-page.component.html',
  styleUrls: ['./turno-page.component.scss'],
})
export class TurnoPageComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;
  readonly responsable: string;

  arqueo: Arqueo | null = null;
  ultimoCierre: Arqueo | null = null;
  ticketImpresion: ThermalTicket | null = null;
  empresa: Empresa | null = null;
  loading = true;
  errorMessage = '';
  submitting = false;
  ahora = new Date();

  readonly abrirForm = this.fb.group({
    monto_apertura: ['', [Validators.required, Validators.min(1)]],
    observacion: ['', Validators.maxLength(255)],
  });

  readonly cerrarForm = this.fb.group({
    monto_cierre_real: ['', [Validators.required, Validators.min(0)]],
    observacion: ['', Validators.maxLength(255)],
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private arqueoService: ArqueoService,
    private empresaService: EmpresaService,
    private notification: NotificationService
  ) {
    this.responsable = this.auth.getUserFullName();
  }

  ngOnInit(): void {
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ahora = new Date();
      });

    this.loadArqueo();
    this.empresaService
      .getEmpresa()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          this.empresa = empresa;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAbierto(): boolean {
    return this.arqueoService.isAbierto(this.arqueo);
  }

  get fechaApertura(): string {
    return this.ahora.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  get horaApertura(): string {
    return this.ahora.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get montoAperturaError(): string {
    const control = this.abrirForm.get('monto_apertura');
    if (!control?.touched && !control?.dirty) return '';
    if (control.hasError('required')) return 'La base inicial es obligatoria';
    if (control.hasError('min')) return 'La base inicial debe ser mayor a cero';
    return '';
  }

  get montoCierreError(): string {
    const control = this.cerrarForm.get('monto_cierre_real');
    if (!control?.touched && !control?.dirty) return '';
    if (control.hasError('required')) return 'El dinero contado es obligatorio';
    if (control.hasError('min')) return 'El monto no puede ser negativo';
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

    const values = this.abrirForm.getRawValue();
    const monto = Number(values.monto_apertura);
    const observacion = values.observacion?.trim() ?? '';
    this.submitting = true;
    this.ultimoCierre = null;

    this.arqueoService
      .abrirArqueo({ monto_apertura: monto, observacion: observacion || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (arqueo) => {
          this.arqueo = arqueo;
          this.abrirForm.reset();
          this.submitting = false;
          this.notification.success('Apertura de caja registrada correctamente');
          this.loadArqueo();
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

    const values = this.cerrarForm.getRawValue();
    const monto = Number(values.monto_cierre_real);
    const observacion = values.observacion?.trim() ?? '';
    const idArqueo = this.arqueo.id_arqueo;
    this.submitting = true;

    this.arqueoService
      .cerrarArqueo(idArqueo, {
        monto_cierre_real: monto,
        observacion: observacion || undefined,
      })
      .pipe(
        switchMap((arqueo) =>
          this.arqueoService.getArqueoDetalle(idArqueo).pipe(
            map((detalle) => ({
              arqueo,
              detalle: {
                ...detalle,
                arqueo: {
                  ...detalle.arqueo,
                  ...arqueo,
                },
              } as TurnoDetalle,
            }))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ arqueo, detalle }) => {
          this.ultimoCierre = arqueo;
          this.arqueo = null;
          this.cerrarForm.reset();
          this.submitting = false;
          if (this.empresa) {
            this.ticketImpresion = buildCierreTicket(detalle, this.empresa);
            printThermalTicket();
          }
          this.notification.success('Cierre de caja registrado. Imprimiendo arqueo…');
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

  formatDateOnly(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTimeOnly(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDiferenciaLabel(diferencia?: number): string {
    if (diferencia == null) return '—';
    if (diferencia > 0) return 'Sobrante';
    if (diferencia < 0) return 'Faltante';
    return 'Cuadrado';
  }
}
