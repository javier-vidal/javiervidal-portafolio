import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { CONTACT } from '../../content/profile';
import { wakeApi } from '../../core/contact-api';
import { contactConfig } from '../../core/contact-config';
import { Icon } from '../../shared/icon/icon';
import { SectionHeading } from '../../shared/section-heading/section-heading';
import { ContactForm } from './contact-form/contact-form';

@Component({
  selector: 'app-sunset',
  imports: [SectionHeading, Icon, ContactForm],
  templateUrl: './sunset.html',
  styleUrl: './sunset.css',
})
export class Sunset {
  protected readonly contact = CONTACT;
  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Al ver la seccion se despierta la API una sola vez, para que este lista al enviar.
    afterNextRender(() => {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          wakeApi(contactConfig().apiUrl);
        }
      });
      observer.observe(this.section().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
