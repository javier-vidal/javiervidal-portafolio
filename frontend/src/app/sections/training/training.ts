import { Component } from '@angular/core';
import { SKILLS_SECTION, SKILL_LEVELS } from '../../content/skills';
import { SectionHeading } from '../../shared/section-heading/section-heading';
import { SkillLevelCard } from './skill-level/skill-level';

@Component({
  selector: 'app-training',
  imports: [SectionHeading, SkillLevelCard],
  templateUrl: './training.html',
  styleUrl: './training.css',
})
export class Training {
  protected readonly section = SKILLS_SECTION;
  protected readonly levels = SKILL_LEVELS;
}
