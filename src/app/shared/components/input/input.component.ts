import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: InputType = 'text';
  @Input() prefixIcon: 'email' | 'lock' | 'user' | 'search' | null = null;
  @Input() suffixIcon: 'eye' | 'eye-off' | null = null;
  @Input() error = '';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() autocomplete = '';
  @Input() id = `input-${Math.random().toString(36).slice(2, 9)}`;

  @Output() suffixClick = new EventEmitter<void>();

  value = '';
  showPassword = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get inputType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  get effectiveSuffixIcon(): 'eye' | 'eye-off' | null {
    if (this.type === 'password' && this.suffixIcon) {
      return this.showPassword ? 'eye-off' : 'eye';
    }
    return this.suffixIcon;
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onSuffixClick(): void {
    if (this.type === 'password') {
      this.showPassword = !this.showPassword;
    }
    this.suffixClick.emit();
  }
}
