import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Mesa, MesaEstado } from '../models/mesa.model';
import { MesaService } from '../services/mesa.service';

@Component({
  selector: 'app-mesa-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent],
  templateUrl: './mesa-list.component.html',
  styleUrls: ['./mesa-list.component.scss'],
})
export class MesaListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly form = this.fb.group({
    numero: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]],
    zona: ['Salón', [Validators.maxLength(50)]],
    capacidad: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
  });

  mesas: Mesa[] = [];
  filtered: Mesa[] = [];
  loading = false;
  errorMessage = '';
  updatingId: number | null = null;
  showModal = false;
  editingId: number | null = null;
  saving = false;
  saveError = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private mesaService: MesaService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilter());

    this.loadMesas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.editingId ? 'Editar mesa' : 'Nueva mesa';
  }

  loadMesas(): void {
    this.loading = true;
    this.errorMessage = '';
    this.mesaService.getMesas().subscribe({
      next: (mesas) => {
        this.mesas = mesas;
        this.applyFilter();
        this.loading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ numero: '', zona: 'Salón', capacidad: 4 });
    this.saveError = '';
    this.showModal = true;
  }

  openEdit(mesa: Mesa): void {
    this.editingId = mesa.id_mesa;
    this.form.patchValue({
      numero: mesa.numero,
      zona: mesa.zona || 'Salón',
      capacidad: mesa.capacidad,
    });
    this.saveError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.saveError = '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      numero: value.numero!.trim(),
      zona: (value.zona ?? '').trim(),
      capacidad: Number(value.capacidad),
    };

    this.saving = true;
    this.saveError = '';

    const request$ = this.editingId
      ? this.mesaService.actualizarMesa(this.editingId, payload)
      : this.mesaService.crearMesa(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadMesas();
        this.notification.success(
          this.editingId ? 'Mesa actualizada' : 'Mesa creada correctamente'
        );
      },
      error: (error: Error) => {
        this.saving = false;
        this.saveError = error.message;
      },
    });
  }

  toggleEstado(mesa: Mesa): void {
    const nuevo = this.mesaService.getEstadoOpuesto(mesa.estado);
    const desactivando = nuevo === 'Inactivo';

    this.confirmDialog
      .open({
        title: desactivando ? '¿Desactivar mesa?' : '¿Activar mesa?',
        message: desactivando
          ? `La mesa "${mesa.numero}" no aparecerá en el salón.`
          : `La mesa "${mesa.numero}" volverá a estar disponible.`,
        confirmText: desactivando ? 'Sí, desactivar' : 'Sí, activar',
        variant: desactivando ? 'danger' : 'success',
        icon: desactivando ? 'warning' : 'question',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.updatingId = mesa.id_mesa;
        this.mesaService.cambiarEstado(mesa.id_mesa, nuevo as MesaEstado).subscribe({
          next: () => {
            this.updatingId = null;
            this.loadMesas();
            this.notification.success(`Mesa ${desactivando ? 'desactivada' : 'activada'}`);
          },
          error: (error: Error) => {
            this.updatingId = null;
            this.notification.error(error.message);
          },
        });
      });
  }

  isActivo(estado: string): boolean {
    return estado.toLowerCase() === 'activo';
  }

  isUpdating(id: number): boolean {
    return this.updatingId === id;
  }

  private applyFilter(): void {
    const term = this.searchControl.value.trim().toLowerCase();
    this.filtered = !term
      ? [...this.mesas]
      : this.mesas.filter(
          (m) =>
            m.numero.toLowerCase().includes(term) ||
            m.zona.toLowerCase().includes(term) ||
            m.estado.toLowerCase().includes(term)
        );
  }
}
