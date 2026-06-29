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
import { Rol, Usuario, UsuarioEstado } from '../models/usuario.model';
import { UsuarioService } from '../services/usuario.service';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.scss'],
})
export class UsuarioListComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 25, 50];

  readonly userForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    id_rol: [null as number | null, Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  loading = false;
  loadingRoles = false;
  errorMessage = '';
  rolesError = '';
  updatingId: number | null = null;

  showModal = false;
  modalMode: ModalMode = 'create';
  editingUsuario: Usuario | null = null;
  saving = false;
  formError = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private confirmDialog: ConfirmDialogService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadUsuarios();
      });

    this.loadRoles();
    this.loadUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.modalMode === 'create' ? 'Nuevo usuario' : 'Editar usuario';
  }

  get modalDescription(): string {
    return this.modalMode === 'create'
      ? 'Completa los datos para registrar un usuario en el sistema.'
      : 'Actualiza los datos del usuario seleccionado.';
  }

  get submitLabel(): string {
    return this.modalMode === 'create' ? 'Crear usuario' : 'Guardar cambios';
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

  get emailError(): string {
    return this.fieldError('email', {
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

  get idRolError(): string {
    return this.fieldError('id_rol', {
      required: 'Debes seleccionar un rol',
    });
  }

  get passwordError(): string {
    const messages: Record<string, string> = {
      required: 'La contraseña es obligatoria',
      minlength: 'Mínimo 6 caracteres',
    };

    if (this.modalMode === 'edit') {
      delete messages['required'];
    }

    return this.fieldError('password', messages);
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingUsuario = null;
    this.formError = '';
    this.userForm.reset();
    this.userForm.get('email')?.enable();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(usuario: Usuario): void {
    this.modalMode = 'edit';
    this.editingUsuario = usuario;
    this.formError = '';
    this.userForm.reset();
    this.userForm.patchValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      id_rol: usuario.rol.id_rol,
      password: '',
    });
    this.userForm.get('email')?.disable();
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.formError = '';
    this.editingUsuario = null;
    this.userForm.reset();
    this.userForm.get('email')?.enable();
  }

  submitForm(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { nombre, apellido, email, telefono, direccion, id_rol, password } =
      this.userForm.getRawValue();

    this.saving = true;
    this.formError = '';

    if (this.modalMode === 'create') {
      this.usuarioService
        .crearUsuario({
          nombre: nombre!,
          apellido: apellido!,
          email: email!,
          telefono: telefono!,
          direccion: direccion!,
          id_rol: id_rol!,
          password: password!,
        })
        .subscribe({
          next: () => this.onSaveSuccess('Usuario creado correctamente'),
          error: (err) => this.onSaveError(err?.message ?? 'Error al crear el usuario'),
        });
      return;
    }

    this.usuarioService
      .actualizarUsuario(this.editingUsuario!.id_usuario, {
        nombre: nombre!,
        apellido: apellido!,
        telefono: telefono!,
        direccion: direccion!,
        id_rol: id_rol!,
      })
      .subscribe({
        next: () => this.onSaveSuccess('Usuario actualizado correctamente'),
        error: (err) => this.onSaveError(err?.message ?? 'Error al actualizar el usuario'),
      });
  }

  loadRoles(): void {
    this.loadingRoles = true;
    this.rolesError = '';

    this.usuarioService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loadingRoles = false;
      },
      error: (err) => {
        this.loadingRoles = false;
        this.rolesError = err?.message ?? 'Error al cargar los roles';
      },
    });
  }

  loadUsuarios(): void {
    this.loading = true;
    this.errorMessage = '';

    this.usuarioService
      .getUsuarios({
        search: this.searchControl.value,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.usuarios = result.items;
          this.totalItems = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al cargar los usuarios';
          this.usuarios = [];
          this.totalItems = 0;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadUsuarios();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadUsuarios();
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

  getFullName(usuario: Usuario): string {
    return `${usuario.nombre} ${usuario.apellido}`.trim();
  }

  toggleEstado(usuario: Usuario): void {
    if (this.isUpdating(usuario.id_usuario)) return;

    const nuevoEstado = this.usuarioService.getEstadoOpuesto(usuario.estado);
    const desactivando = nuevoEstado === 'Inactivo';

    this.confirmDialog
      .open({
        title: desactivando ? '¿Desactivar usuario?' : '¿Activar usuario?',
        message: desactivando
          ? `El usuario "${this.getFullName(usuario)}" quedará inactivo y no podrá iniciar sesión.`
          : `El usuario "${this.getFullName(usuario)}" quedará activo y podrá iniciar sesión.`,
        confirmText: desactivando ? 'Sí, desactivar' : 'Sí, activar',
        cancelText: 'Cancelar',
        variant: desactivando ? 'danger' : 'success',
        icon: desactivando ? 'warning' : 'question',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.ejecutarCambioEstado(usuario, nuevoEstado);
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
    this.userForm.reset();
    this.editingUsuario = null;
    this.page = 1;
    this.loadUsuarios();
    this.notification.success(message);
  }

  private onSaveError(message: string): void {
    this.saving = false;
    this.formError = message;
    this.notification.error(message);
  }

  private ejecutarCambioEstado(usuario: Usuario, nuevoEstado: UsuarioEstado): void {
    this.updatingId = usuario.id_usuario;

    this.usuarioService.cambiarEstado(usuario.id_usuario, nuevoEstado).subscribe({
      next: (updated) => {
        const index = this.usuarios.findIndex(
          (item) => item.id_usuario === usuario.id_usuario
        );

        if (index >= 0) {
          this.usuarios[index] = updated;
        }

        this.updatingId = null;
        this.notification.success(
          nuevoEstado === 'Activo'
            ? `Usuario "${this.getFullName(usuario)}" activado`
            : `Usuario "${this.getFullName(usuario)}" desactivado`
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
    const control = this.userForm.get(controlName);
    if (!control?.touched || !control.errors) return '';

    for (const key of Object.keys(messages)) {
      if (control.errors[key]) return messages[key];
    }

    return '';
  }
}
