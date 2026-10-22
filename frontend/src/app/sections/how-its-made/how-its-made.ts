import { Component } from '@angular/core';
import { LIGHTHOUSE_SCORES, REPO_LINK, SITE_DETAILS, SITE_SECTION } from '../../content/site-info';
import { SectionHeading } from '../../shared/section-heading/section-heading';

@Component({
  selector: 'app-how-its-made',
  imports: [SectionHeading],
  templateUrl: './how-its-made.html',
  styleUrl: './how-its-made.css',
})
export class HowItsMade {
  protected readonly section = SITE_SECTION;
  protected readonly details = SITE_DETAILS;
  protected readonly scores = LIGHTHOUSE_SCORES;
  protected readonly repoLink = REPO_LINK;
}
