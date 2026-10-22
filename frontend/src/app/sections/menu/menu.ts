import { Component } from '@angular/core';
import { MENU_SECTION, PROJECTS } from '../../content/projects';
import { SectionHeading } from '../../shared/section-heading/section-heading';
import { DishCard } from './dish-card/dish-card';

@Component({
  selector: 'app-menu',
  imports: [SectionHeading, DishCard],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  protected readonly section = MENU_SECTION;
  protected readonly projects = PROJECTS;
}
