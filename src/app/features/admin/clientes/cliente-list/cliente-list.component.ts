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
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Cliente,
  ClienteEstado,
  TIPOS_USUARIO,
  TipoDocumento,
} from '../models/cliente.model';
import { ClienteService } from '../services/cliente.service';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.scss'],
})
export class ClienteListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly tiposUsuario = TIPOS_USUARIO;

  readonly clienteForm = this.fb.group({
    tipo_usuario: ['', Validators.required],
    tipo_documento: [null as number | null, Validators.required],
    numero_documento: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    ciudad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    departamento: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    pais: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

  clientes: Cliente[] = [];
  tiposDocumento: TipoDocumento[] = [];
  loading = false;
  loadingTiposDocumento = false;
  errorMessage = '';
  tiposDocumentoError = '';
  updatingId: number | null = null;

  showModal = false;
  modalMode: ModalMode = 'create';
  editingCliente: Cliente | null = null;
  saving = false;
  formError = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadClientes();
      });

    this.loadTiposDocumento();
    this.loadClientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.modalMode === 'create' ? 'Nuevo cliente' : 'Editar cliente';
  }

  get modalDescription(): string {
    return this.modalMode === 'create'
      ? 'Completa los datos para registrar un cliente.'
      : 'Actualiza los datos del cliente seleccionado.';
  }

  get submitLabel(): string {
    return this.modalMode === 'create' ? 'Crear cliente' : 'Guardar cambios';
  }

  get tipoUsuarioError(): string {
    return this.fieldError('tipo_usuario', { required: 'El tipo de usuario es obligatorio' });
  }

  get tipoDocumentoError(): string {
    return this.fieldError('tipo_documento', { required: 'El tipo de documento es obligatorio' });
  }

  get numeroDocumentoError(): string {
    return this.fieldError('numero_documento', {
      required: 'El número de documento es obligatorio',
      minlength: 'Mínimo 3 caracteres',
      maxlength: 'Máximo 20 caracteres',
    });
  }

  get nombreError(): string {
    return this.fieldError('nombre', {
      required: 'El nombre es obligatorio',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  get apellidoError(): string {
    return this.fieldError('apellido', {
      required: 'El apellido es obligatorio',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  get correoError(): string {
    return this.fieldError('correo', {
      required: 'El correo es obligatorio',
      email: 'Correo electrónico inválido',
      maxlength: 'Máximo 120 caracteres',
    });
  }

  get telefonoError(): string {
    return this.fieldError('telefono', {
      required: 'El teléfono es obligatorio',
      minlength: 'Mínimo 7 caracteres',
      maxlength: 'Máximo 20 caracteres',
    });
  }

  get direccionError(): string {
    return this.fieldError('direccion', {
      required: 'La dirección es obligatoria',
      minlength: 'Mínimo 3 caracteres',
      maxlength: 'Máximo 200 caracteres',
    });
  }

  get ciudadError(): string {
    return this.fieldError('ciudad', {
      required: 'La ciudad es obligatoria',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  get departamentoError(): string {
    return this.fieldError('departamento', {
      required: 'El departamento es obligatorio',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  get paisError(): string {
    return this.fieldError('pais', {
      required: 'El país es obligatorio',
      minlength: 'Mínimo 2 caracteres',
      maxlength: 'Máximo 80 caracteres',
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingCliente = null;
    this.formError = '';
    this.clienteForm.reset();
    this.showModal = true;
  }

  openEditModal(cliente: Cliente): void {
    this.modalMode = 'edit';
    this.editingCliente = cliente;
    this.formError = '';
    this.clienteForm.reset();
    this.clienteForm.patchValue({
      tipo_usuario: cliente.tipo_usuario,
      tipo_documento: Number(cliente.tipo_documento) || null,
      numero_documento: cliente.numero_documento,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      correo: cliente.correo,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      departamento: cliente.departamento,
      pais: cliente.pais,
    });
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.formError = '';
    this.editingCliente = null;
    this.clienteForm.reset();
  }

  submitForm(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const payload = this.clienteForm.getRawValue();
    this.saving = true;
    this.formError = '';

    const request = {
      tipo_usuario: payload.tipo_usuario!,
      tipo_documento: Number(payload.tipo_documento),
      numero_documento: payload.numero_documento!,
      nombre: payload.nombre!,
      apellido: payload.apellido!,
      correo: payload.correo!,
      telefono: payload.telefono!,
      direccion: payload.direccion!,
      ciudad: payload.ciudad!,
      departamento: payload.departamento!,
      pais: payload.pais!,
    };

    if (this.modalMode === 'create') {
      this.clienteService.crearCliente(request).subscribe({
        next: () => this.onSaveSuccess('Cliente creado correctamente'),
        error: (err) => this.onSaveError(err?.message ?? 'Error al crear el cliente'),
      });
      return;
    }

    this.clienteService
      .actualizarCliente(this.editingCliente!.id_cliente, {
        nombre: request.nombre,
        apellido: request.apellido,
        telefono: request.telefono,
        direccion: request.direccion,
        ciudad: request.ciudad,
        departamento: request.departamento,
        pais: request.pais,
        correo: request.correo,
      })
      .subscribe({
        next: () => this.onSaveSuccess('Cliente actualizado correctamente'),
        error: (err) => this.onSaveError(err?.message ?? 'Error al actualizar el cliente'),
      });
  }

  loadTiposDocumento(): void {
    this.loadingTiposDocumento = true;
    this.tiposDocumentoError = '';

    this.clienteService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
        this.loadingTiposDocumento = false;
      },
      error: (err) => {
        this.loadingTiposDocumento = false;
        this.tiposDocumentoError = err?.message ?? 'Error al cargar tipos de documento';
      },
    });
  }

  loadClientes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.clienteService
      .getClientes({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.clientes = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar los clientes';
          this.clientes = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadClientes();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadClientes();
  }

  isActivo(estado: string): boolean {
    return estado.toLowerCase() === 'activo';
  }

  isUpdating(id: number): boolean {
    return this.updatingId === id;
  }

  getToggleLabel(estado: string): string {
    return this.isActivo(estado) ? 'Desactivar' : 'Activar';
  }

  getFullName(cliente: Cliente): string {
    return `${cliente.nombre} ${cliente.apellido}`.trim();
  }

  toggleEstado(cliente: Cliente): void {
    if (this.isUpdating(cliente.id_cliente)) return;

    const nuevoEstado = this.clienteService.getEstadoOpuesto(cliente.estado);
    const desactivando = nuevoEstado === 'Inactivo';

    this.confirmDialog
      .open({
        title: desactivando ? '¿Desactivar cliente?' : '¿Activar cliente?',
        message: desactivando
          ? `El cliente "${this.getFullName(cliente)}" quedará inactivo.`
          : `El cliente "${this.getFullName(cliente)}" quedará activo.`,
        confirmText: desactivando ? 'Sí, desactivar' : 'Sí, activar',
        cancelText: 'Cancelar',
        variant: desactivando ? 'danger' : 'success',
        icon: desactivando ? 'warning' : 'question',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.ejecutarCambioEstado(cliente, nuevoEstado);
        }
      });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private onSaveSuccess(message: string): void {
    this.saving = false;
    this.showModal = false;
    this.clienteForm.reset();
    this.editingCliente = null;
    this.page = 1;
    this.loadClientes();
    this.notification.success(message);
  }

  private onSaveError(message: string): void {
    this.saving = false;
    this.formError = message;
    this.notification.error(message);
  }

  private ejecutarCambioEstado(cliente: Cliente, nuevoEstado: ClienteEstado): void {
    this.updatingId = cliente.id_cliente;

    this.clienteService.cambiarEstado(cliente.id_cliente, nuevoEstado).subscribe({
      next: (updated) => {
        const index = this.clientes.findIndex(
          (item) => item.id_cliente === cliente.id_cliente
        );

        if (index >= 0) {
          this.clientes[index] = updated;
        }

        this.updatingId = null;
        this.notification.success(
          nuevoEstado === 'Activo'
            ? `Cliente "${this.getFullName(cliente)}" activado`
            : `Cliente "${this.getFullName(cliente)}" desactivado`
        );
      },
      error: (err) => {
        this.updatingId = null;
        this.notification.error(err?.message ?? 'Error al cambiar el estado');
      },
    });
  }

  private fieldError(
    controlName: string,
    messages: Record<string, string>
  ): string {
    const control = this.clienteForm.get(controlName);
    if (!control?.touched || !control.errors) return '';

    for (const key of Object.keys(messages)) {
      if (control.errors[key]) return messages[key];
    }

    return '';
  }
}
