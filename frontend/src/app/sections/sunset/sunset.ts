import { Component } from '@angular/core';
import { CONTACT } from '../../content/profile';
import { Icon } from '../../shared/icon/icon';
import { SectionHeading } from '../../shared/section-heading/section-heading';

@Component({
  selector: 'app-sunset',
  imports: [SectionHeading, Icon],
  templateUrl: './sunset.html',
  styleUrl: './sunset.css',
})
export class Sunset {
  protected readonly contact = CONTACT;
}
