import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="chart-canvas-wrap"><canvas #canvas></canvas></div>`,
  styles: [
    `
      .chart-canvas-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 220px;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    `,
  ],
})
export class ChartCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) config!: ChartConfiguration;

  private chart?: Chart;
  private viewReady = false;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.viewReady && !changes['config'].firstChange) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.canvasRef?.nativeElement || !this.config) return;

    this.ngZone.runOutsideAngular(() => {
      this.chart?.destroy();
      this.chart = new Chart(this.canvasRef.nativeElement, {
        ...this.config,
        options: {
          ...this.config.options,
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
        },
      });
      this.cdr.markForCheck();
    });
  }
}
