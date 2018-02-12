import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FormatterService } from './formatter.service';
import { TopLevelService } from './top-level.service';
import { TableTemplatesService } from './table-templates.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [FormatterService, TopLevelService, TableTemplatesService]
})
export class ServicesModule { }
