import { Component } from '@angular/core';
import { PROFILE } from '../../content/profile';

@Component({
  selector: 'app-sunrise',
  templateUrl: './sunrise.html',
  styleUrl: './sunrise.css',
})
export class Sunrise {
  protected readonly profile = PROFILE;
}
