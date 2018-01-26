import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { BlockModule } from './block/block.module';
import { ClusterModule } from './cluster/cluster.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OsdModule } from './osd/osd.module';

@NgModule({
  imports: [
    CommonModule,
    ClusterModule,
    DashboardModule,
    BlockModule,
    OsdModule
  ],
  exports: [OsdModule],
  declarations: []
})
export class CephModule { }
