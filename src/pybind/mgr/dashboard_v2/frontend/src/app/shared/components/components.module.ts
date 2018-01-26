import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { OsdDetailsComponent } from '../../ceph/osd/osd-details/osd-details.component';
import { TableDetailsDirective } from './table/table-details.directive';
import { TableComponent } from './table/table.component';

@NgModule({
  entryComponents: [OsdDetailsComponent],
  imports: [CommonModule, NgxDatatableModule, FormsModule],
  declarations: [TableComponent, TableDetailsDirective],
  exports: [TableComponent, NgxDatatableModule]
})
export class ComponentsModule {}
