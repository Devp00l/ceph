import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    PipesModule
  ],
  exports: [
    PipesModule
  ],
  declarations: []
})
export class SharedModule { }
