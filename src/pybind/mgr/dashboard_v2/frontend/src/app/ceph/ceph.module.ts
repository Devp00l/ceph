import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ClusterModule } from './cluster/cluster.module';
import { OsdModule } from './osd/osd.module';

@NgModule({
  imports: [
    CommonModule,
    ClusterModule,
    OsdModule
  ],
  exports: [OsdModule],
  declarations: []
})
export class CephModule { }
