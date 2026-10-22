import { Component, input } from '@angular/core';
import { Project } from '../../../content/projects';

@Component({
  selector: 'app-dish-card',
  templateUrl: './dish-card.html',
  styleUrl: './dish-card.css',
})
export class DishCard {
  readonly project = input.required<Project>();
}
