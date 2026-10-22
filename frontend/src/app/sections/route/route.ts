import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { EARLY_STOPS, MAIN_STOPS, ROUTE_SECTION } from '../../content/experience';
import { listenToScroll, sectionProgress } from '../../core/day-cycle';
import { SectionHeading } from '../../shared/section-heading/section-heading';
import { EarlyDays } from './early-days/early-days';
import { RouteCar } from './route-car/route-car';
import { RouteStop } from './route-stop/route-stop';

@Component({
  selector: 'app-route',
  imports: [SectionHeading, RouteStop, RouteCar, EarlyDays],
  templateUrl: './route.html',
  styleUrl: './route.css',
})
export class Route {
  private readonly document = inject(DOCUMENT);
  private readonly timeline = viewChild.required<ElementRef<HTMLElement>>('timeline');

  protected readonly section = ROUTE_SECTION;
  protected readonly mainStops = MAIN_STOPS;
  protected readonly earlyStops = EARLY_STOPS;
  protected readonly carProgress = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.document.defaultView;
      if (win) {
        destroyRef.onDestroy(listenToScroll(win, () => this.measure()));
      }
    });
  }

  protected onEarlyDaysToggle(): void {
    // Espera a que se dibujen las paradas nuevas antes de medir.
    this.document.defaultView?.requestAnimationFrame(() => this.measure());
  }

  private measure(): void {
    const viewportHeight = this.document.defaultView?.innerHeight ?? 0;
    const rect = this.timeline().nativeElement.getBoundingClientRect();
    this.carProgress.set(sectionProgress(rect.top, rect.height, viewportHeight));
  }
}
