import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceListPipe } from './service-list.pipe';
import { ServersComponent } from './servers/servers.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [ServersComponent, ServiceListPipe],
  exports: []
})
export class ClusterModule { }
