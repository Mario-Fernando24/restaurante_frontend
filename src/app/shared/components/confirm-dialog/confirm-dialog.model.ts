export type ConfirmDialogVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';

export type ConfirmDialogIcon = 'question' | 'warning' | 'info' | 'success' | 'danger';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  icon?: ConfirmDialogIcon;
  /** Cerrar al hacer clic fuera o presionar Escape. Por defecto: true */
  dismissible?: boolean;
}

export interface ConfirmDialogOptions extends ConfirmDialogConfig {
  confirmText: string;
  cancelText: string;
  variant: ConfirmDialogVariant;
  icon: ConfirmDialogIcon;
  dismissible: boolean;
}

export const CONFIRM_DIALOG_DEFAULTS: Omit<ConfirmDialogOptions, 'title' | 'message'> = {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'default',
  icon: 'question',
  dismissible: true,
};
