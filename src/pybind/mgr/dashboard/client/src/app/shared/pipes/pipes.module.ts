import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthColorPipe } from './health-color.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [HealthColorPipe],
  exports: [HealthColorPipe]
})
export class PipesModule { }
