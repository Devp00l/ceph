import { Component, OnChanges } from '@angular/core';

import { MgrModuleService } from '../../../../shared/api/mgr-module.service';
import {SelectionService} from "../../../../shared/services/selection.service";

@Component({
  selector: 'cd-mgr-module-details',
  templateUrl: './mgr-module-details.component.html',
  styleUrls: ['./mgr-module-details.component.scss']
})
export class MgrModuleDetailsComponent implements OnChanges {
  module_config: any;

  constructor(private mgrModuleService: MgrModuleService, public selection: SelectionService) {}

  ngOnChanges() {
    if (this.selection.hasSelection) {
      const selectedItem = this.selection.first();
      this.mgrModuleService.getConfig(selectedItem.name).subscribe((resp: any) => {
        this.module_config = resp;
      });
    }
  }
}
