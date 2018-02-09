import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import {ComponentsModule} from '../../../shared/components/components.module';
import { OsdDetailsComponent } from './osd-details/osd-details.component';
import { OsdListComponent } from './osd-list/osd-list.component';
import { OsdPerformanceHistogramComponent } from './osd-performance-histogram/osd-performance-histogram.component';
import { OsdRoutingModule } from './osd-routing.module';
import { OsdService } from './osd.service';

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
  declarations: [OsdListComponent, OsdDetailsComponent, OsdPerformanceHistogramComponent],
  providers: [OsdService]
})
export class OsdModule { }
