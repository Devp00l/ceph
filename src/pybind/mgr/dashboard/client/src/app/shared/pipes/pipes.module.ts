import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthColorPipe } from './health-color.pipe';
import { ShortVersionPipe } from './short-version.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [HealthColorPipe, ShortVersionPipe],
  exports: [HealthColorPipe, ShortVersionPipe]
})
export class PipesModule { }
