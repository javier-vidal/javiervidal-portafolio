import { Component, input } from '@angular/core';

@Component({
  selector: 'app-route-car',
  templateUrl: './route-car.html',
  styleUrl: './route-car.css',
})
export class RouteCar {
  /** Avance del auto en la ruta, entre 0 y 1. */
  readonly progress = input.required<number>();
}
