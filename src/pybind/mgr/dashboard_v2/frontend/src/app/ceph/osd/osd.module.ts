import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HttpClientModule} from '@angular/common/http';

import { OsdRoutingModule } from './osd-routing.module';
import { OsdListComponent } from './osd-list/osd-list.component';
import { OsdService } from './osd.service';
import {ComponentsModule} from '../../shared/components/components.module';
import { OsdDetailsComponent } from './osd-details/osd-details.component';

@NgModule({
  imports: [
    CommonModule,
    OsdRoutingModule,
    HttpClientModule,
    ComponentsModule
  ],
  exports: [
    OsdListComponent,
    OsdDetailsComponent
  ],
  declarations: [OsdListComponent, OsdDetailsComponent],
  providers: [OsdService]
})
export class OsdModule { }
