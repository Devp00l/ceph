import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthComponent } from './health/health.component';
import { PgStatusStylePipe } from './pg-status-style.pipe';
import { LogColorPipe } from './log-color.pipe';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [HealthComponent, PgStatusStylePipe, LogColorPipe]
})
export class HealthModule { }
