import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CephRoutingModule } from './ceph-routing.module';
import { HealthComponent } from './health/health.component';

@NgModule({
  imports: [
    CommonModule,
    CephRoutingModule
  ],
  declarations: [HealthComponent]
})
export class CephModule { }
