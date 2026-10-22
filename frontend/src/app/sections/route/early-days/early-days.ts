import { Component, input, output, signal } from '@angular/core';
import { ExperienceStop } from '../../../content/experience';
import { RouteStop } from '../route-stop/route-stop';

@Component({
  selector: 'app-early-days',
  imports: [RouteStop],
  templateUrl: './early-days.html',
  styleUrl: './early-days.css',
})
export class EarlyDays {
  readonly intro = input.required<string>();
  readonly stops = input.required<ExperienceStop[]>();

  /** Avisa al padre que cambio la altura de la ruta. */
  readonly expandedChange = output<boolean>();

  protected readonly expanded = signal(false);

  protected toggle(): void {
    this.expanded.update((value) => !value);
    this.expandedChange.emit(this.expanded());
  }
}
