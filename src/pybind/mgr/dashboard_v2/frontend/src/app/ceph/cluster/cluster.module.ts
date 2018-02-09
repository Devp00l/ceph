import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ComponentsModule } from '../../shared/components/components.module';
import { SharedModule } from '../../shared/shared.module';
import { HostsComponent } from './hosts/hosts.component';
import { OsdModule } from './osd/osd.module';
import { ServiceListPipe } from './service-list.pipe';

@NgModule({
  declarations: [
    HostsComponent,
    ServiceListPipe
  ],
  exports: [OsdModule],
  imports: [
    CommonModule,
    ComponentsModule,
    OsdModule,
    SharedModule
  ],
  providers: [
    ServiceListPipe
  ]
})
export class ClusterModule { }
