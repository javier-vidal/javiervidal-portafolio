import { Component, input } from '@angular/core';
import { ExperienceStop } from '../../../content/experience';

@Component({
  selector: 'app-route-stop',
  templateUrl: './route-stop.html',
  styleUrl: './route-stop.css',
})
export class RouteStop {
  readonly stop = input.required<ExperienceStop>();
}
