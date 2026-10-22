import { Component, input } from '@angular/core';
import { MAX_RANK, SkillLevel } from '../../../content/skills';

@Component({
  selector: 'app-skill-level',
  templateUrl: './skill-level.html',
  styleUrl: './skill-level.css',
})
export class SkillLevelCard {
  readonly level = input.required<SkillLevel>();

  // Una barra por rango, como los niveles de una progresion de calistenia.
  protected readonly maxRank = MAX_RANK;
  protected readonly bars = Array.from({ length: MAX_RANK }, (_, index) => index + 1);
}
