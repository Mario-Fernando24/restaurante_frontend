import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Empresa } from '../../../core/models/empresa.model';
import { EmpresaService } from '../../../core/services/empresa.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ThermalReceiptComponent } from '../../../shared/thermal/thermal-receipt.component';
import { ThermalTicket } from '../../../shared/thermal/thermal-ticket.model';
import { buildGastoTicket, printThermalTicket } from '../../../shared/thermal/thermal-ticket.util';
import { MetodoPago } from '../models/venta.model';
import { GASTO_TIPO_LABELS, GastoTipo } from '../models/gasto.model';
import { GastoService } from '../services/gasto.service';
import { VentaService } from '../services/venta.service';

@Component({
  selector: 'app-gasto-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ThermalReceiptComponent,
  ],
  templateUrl: './gasto-page.component.html',
  styleUrls: ['./gasto-page.component.scss'],
})
export class GastoPageComponent implements OnInit, OnDestroy {
  readonly tipos: { value: GastoTipo; label: string }[] = (
    Object.entries(GASTO_TIPO_LABELS) as [GastoTipo, string][]
  ).map(([value, label]) => ({ value, label }));

  metodosPago: MetodoPago[] = [];
  empresa: Empresa | null = null;
  ticketImpresion: ThermalTicket | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';

  readonly form = this.fb.group({
    tipo: ['ADMINISTRATIVO' as GastoTipo, Validators.required],
    concepto: ['', [Validators.required, Validators.maxLength(200)]],
    beneficiario: ['', Validators.maxLength(120)],
    monto: ['', [Validators.required, Validators.min(1)]],
    metodo_pago: ['EFECTIVO', Validators.required],
    referencia: [''],
    observacion: ['', Validators.maxLength(255)],
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private gastoService: GastoService,
    private ventaService: VentaService,
    private empresaService: EmpresaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.form
      .get('tipo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tipo) => {
        const beneficiario = this.form.get('beneficiario');
        if (tipo === 'NOMINA') {
          beneficiario?.setValidators([Validators.required, Validators.maxLength(120)]);
        } else {
          beneficiario?.setValidators([Validators.maxLength(120)]);
        }
        beneficiario?.updateValueAndValidity();
      });

    this.ventaService
      .getMetodosPago()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metodos) => {
          this.metodosPago = metodos;
          if (metodos[0]) {
            this.form.patchValue({ metodo_pago: metodos[0].metodo_pago });
          }
        },
        error: (error: Error) => this.notification.error(error.message),
      });

    this.empresaService
      .getEmpresa()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          this.empresa = empresa;
          this.loading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get esNomina(): boolean {
    return this.form.value.tipo === 'NOMINA';
  }

  metodoRequiereReferencia(): boolean {
    const code = String(this.form.value.metodo_pago ?? '');
    const metodo = this.metodosPago.find((m) => m.metodo_pago === code);
    return Boolean(metodo?.requiere_referencia);
  }

  submit(): void {
    if (this.form.invalid || !this.empresa) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.metodoRequiereReferencia() && !this.form.value.referencia?.trim()) {
      this.notification.error('Completa la referencia del pago');
      return;
    }

    const values = this.form.getRawValue();
    this.submitting = true;

    this.gastoService
      .crearGasto({
        tipo: values.tipo as GastoTipo,
        concepto: values.concepto?.trim() ?? '',
        beneficiario: values.beneficiario?.trim() || undefined,
        monto: Number(values.monto),
        metodo_pago: String(values.metodo_pago),
        referencia: values.referencia?.trim() || undefined,
        observacion: values.observacion?.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gasto) => {
          this.submitting = false;
          this.ticketImpresion = buildGastoTicket(gasto, this.empresa!);
          this.form.reset({
            tipo: 'ADMINISTRATIVO',
            metodo_pago: this.metodosPago[0]?.metodo_pago ?? 'EFECTIVO',
          });
          this.notification.success('Egreso registrado. Imprimiendo comprobante…');
          printThermalTicket();
        },
        error: (error: Error) => {
          this.submitting = false;
          this.notification.error(error.message);
        },
      });
  }
}
