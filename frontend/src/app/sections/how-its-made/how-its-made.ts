import { Component } from '@angular/core';
import {
  LIGHTHOUSE_NOTE,
  LIGHTHOUSE_SCORES,
  PAGESPEED_LINK,
  REPO_LINK,
  SITE_DETAILS,
  SITE_SECTION,
} from '../../content/site-info';
import { Icon } from '../../shared/icon/icon';
import { SectionHeading } from '../../shared/section-heading/section-heading';

@Component({
  selector: 'app-how-its-made',
  imports: [SectionHeading, Icon],
  templateUrl: './how-its-made.html',
  styleUrl: './how-its-made.css',
})
export class HowItsMade {
  protected readonly section = SITE_SECTION;
  protected readonly details = SITE_DETAILS;
  protected readonly scores = LIGHTHOUSE_SCORES;
  protected readonly scoresNote = LIGHTHOUSE_NOTE;
  protected readonly pagespeedLink = PAGESPEED_LINK;
  protected readonly repoLink = REPO_LINK;
}
