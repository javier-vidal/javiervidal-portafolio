import { Component, input } from '@angular/core';

export type IconName = 'github' | 'linkedin' | 'mail';

/** Icono decorativo en linea; toma el color del texto que lo rodea. */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  host: { 'aria-hidden': 'true' },
})
export class Icon {
  readonly name = input.required<IconName>();
}
