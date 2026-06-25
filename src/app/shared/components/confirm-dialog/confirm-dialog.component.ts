import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmDialogOptions } from './confirm-dialog.model';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnDestroy {
  config: ConfirmDialogOptions | null = null;
  visible = false;

  private readonly destroy$ = new Subject<void>();

  constructor(private confirmDialog: ConfirmDialogService) {
    this.confirmDialog.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((active) => {
        this.visible = !!active;
        this.config = active?.config ?? null;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible && this.config?.dismissible) {
      this.confirmDialog.cancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.config?.dismissible) return;
    if (event.target === event.currentTarget) {
      this.confirmDialog.cancel();
    }
  }

  onConfirm(): void {
    this.confirmDialog.confirm();
  }

  onCancel(): void {
    this.confirmDialog.cancel();
  }
}
