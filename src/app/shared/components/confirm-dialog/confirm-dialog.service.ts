import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  CONFIRM_DIALOG_DEFAULTS,
  ConfirmDialogConfig,
  ConfirmDialogOptions,
} from './confirm-dialog.model';

interface ActiveConfirmDialog {
  config: ConfirmDialogOptions;
  subscriber: Subscriber<boolean>;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly stateSubject = new BehaviorSubject<ActiveConfirmDialog | null>(null);
  readonly state$ = this.stateSubject.asObservable();

  open(config: ConfirmDialogConfig): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.stateSubject.next({
        config: this.withDefaults(config),
        subscriber,
      });
    }).pipe(take(1));
  }

  confirm(): void {
    this.resolve(true);
  }

  cancel(): void {
    this.resolve(false);
  }

  private resolve(confirmed: boolean): void {
    const active = this.stateSubject.value;
    if (!active) return;

    active.subscriber.next(confirmed);
    active.subscriber.complete();
    this.stateSubject.next(null);
  }

  private withDefaults(config: ConfirmDialogConfig): ConfirmDialogOptions {
    return {
      ...CONFIRM_DIALOG_DEFAULTS,
      ...config,
    };
  }
}
