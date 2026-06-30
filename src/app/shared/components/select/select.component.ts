import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption<T = string | number | null> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Selecciona una opción';
  @Input() options: SelectOption[] = [];
  @Input() error = '';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() id = `select-${Math.random().toString(36).slice(2, 9)}`;

  value: string | number | null = null;
  isOpen = false;
  highlightedIndex = -1;
  panelStyle: { top: string; left: string; width: string } = {
    top: '0px',
    left: '0px',
    width: '0px',
  };

  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get selectedLabel(): string {
    const option = this.options.find((item) => this.sameValue(item.value, this.value));
    return option?.label ?? '';
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  writeValue(value: string | number | null): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleOpen(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.highlightedIndex = this.options.findIndex((item) =>
        this.sameValue(item.value, this.value)
      );
      this.updatePanelPosition();
    }
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.onTouched();
  }

  selectOption(option: SelectOption, index: number): void {
    if (option.disabled) return;
    this.value = option.value;
    this.onChange(option.value);
    this.highlightedIndex = index;
    this.close();
  }

  isSelected(option: SelectOption): boolean {
    return this.sameValue(option.value, this.value);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleOpen();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen) {
        this.toggleOpen();
        return;
      }
      this.moveHighlight(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen) {
        this.toggleOpen();
        return;
      }
      this.moveHighlight(-1);
      return;
    }

    if (event.key === 'Escape') {
      this.close();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.isOpen) {
      this.updatePanelPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private moveHighlight(step: number): void {
    if (!this.options.length) return;

    let index = this.highlightedIndex;
    do {
      index = (index + step + this.options.length) % this.options.length;
    } while (this.options[index]?.disabled && index !== this.highlightedIndex);

    this.highlightedIndex = index;
  }

  private updatePanelPosition(): void {
    const trigger = this.triggerBtn?.nativeElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    this.panelStyle = {
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    };
  }

  private sameValue(a: unknown, b: unknown): boolean {
    return String(a) === String(b);
  }
}
