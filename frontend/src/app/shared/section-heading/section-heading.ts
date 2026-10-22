import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.css',
})
export class SectionHeading {
  readonly time = input.required<string>();
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly intro = input<string>();
}
