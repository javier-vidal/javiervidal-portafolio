import { Component, afterNextRender, inject } from '@angular/core';
import { CONTACT } from './content/profile';
import { DayCycle } from './core/day-cycle';
import { HowItsMade } from './sections/how-its-made/how-its-made';
import { Menu } from './sections/menu/menu';
import { Route } from './sections/route/route';
import { Sunrise } from './sections/sunrise/sunrise';
import { Sunset } from './sections/sunset/sunset';
import { Training } from './sections/training/training';

@Component({
  selector: 'app-root',
  imports: [Sunrise, Training, Route, Menu, Sunset, HowItsMade],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly footer = CONTACT.footer;

  constructor() {
    const dayCycle = inject(DayCycle);
    // El scroll solo existe en el navegador, no durante el prerenderizado.
    afterNextRender(() => dayCycle.start());
  }
}
