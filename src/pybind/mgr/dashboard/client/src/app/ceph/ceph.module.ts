import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CephRoutingModule } from './ceph-routing.module';
import { HealthModule } from './health/health.module';

@NgModule({
  imports: [
    CommonModule,
    CephRoutingModule,
    HealthModule
  ]
})
export class CephModule { }
