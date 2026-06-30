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
import { printThermalTicket } from '../../../shared/thermal/thermal-ticket.util';
import { ROUTES } from '../../../core/routing/route-paths';
import { CartaPublicaService } from '../../public/carta/services/carta-publica.service';

@Component({
  selector: 'app-empresa-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ThermalReceiptComponent,
  ],
  templateUrl: './empresa-config.component.html',
  styleUrls: ['./empresa-config.component.scss'],
})
export class EmpresaConfigComponent implements OnInit, OnDestroy {
  readonly routes = ROUTES;
  readonly cartaUrl = this.cartaPublicaService.getCartaPublicUrl();

  loading = true;
  saving = false;
  errorMessage = '';
  previewTicket: ThermalTicket | null = null;

  readonly form = this.fb.group({
    razon_social: ['', [Validators.required, Validators.maxLength(150)]],
    nombre_comercial: ['', [Validators.required, Validators.maxLength(120)]],
    nit: ['', [Validators.required, Validators.maxLength(30)]],
    direccion: ['', [Validators.required, Validators.maxLength(200)]],
    ciudad: ['', [Validators.required, Validators.maxLength(80)]],
    telefono: ['', Validators.maxLength(40)],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    pie_ticket: ['', Validators.maxLength(255)],
  });

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private notification: NotificationService,
    private cartaPublicaService: CartaPublicaService
  ) {}

  ngOnInit(): void {
    this.empresaService
      .getEmpresa()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          this.form.patchValue(empresa);
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.empresaService
      .actualizarEmpresa(this.form.getRawValue() as Empresa)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.notification.success('Datos del negocio guardados');
        },
        error: (error: Error) => {
          this.saving = false;
          this.notification.error(error.message);
        },
      });
  }

  preview(): void {
    const empresa = this.form.getRawValue() as Empresa;
    this.previewTicket = {
      tipo: 'VENTA',
      titulo: 'VISTA PREVIA DE TICKET',
      numero: '000001',
      fecha: new Date().toLocaleString('es-CO'),
      empresa: { ...empresa, id_empresa: 1 },
      cajero: 'Cajero demo',
      lineas: [
        {
          producto: 'Perro al carbón',
          cantidad: 1,
          precio: 12000,
          total: 12000,
        },
      ],
      totalQty: 1,
      totalCobrado: 12000,
      metodoPago: 'Efectivo',
    };
    printThermalTicket();
  }

  async copyCartaLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.cartaUrl);
      this.notification.success('Enlace de la carta copiado');
    } catch {
      this.notification.error('No se pudo copiar el enlace');
    }
  }
}
