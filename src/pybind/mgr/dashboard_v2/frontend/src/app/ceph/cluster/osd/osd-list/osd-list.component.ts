import { Component } from '@angular/core';

import { CellTemplate } from '../../../../shared/enum/cell-template.enum';
import { CdTableColumn } from '../../../../shared/models/cd-table-column';
import { DimlessPipe } from '../../../../shared/pipes/dimless.pipe';
import { OsdService } from '../osd.service';

@Component({
  selector: 'cd-osd-list',
  templateUrl: './osd-list.component.html',
  styleUrls: ['./osd-list.component.scss']
})

export class OsdListComponent {
  osds = [];
  detailsComponent = 'OsdDetailsComponent';
  columns: CdTableColumn[];

  constructor(
    private osdService: OsdService,
    private dimlessPipe: DimlessPipe
  ) {
    this.columns = [
      {prop: 'host.name', name: 'Host'},
      {prop: 'id', name: 'ID', cellTransformation: CellTemplate.bold},
      {prop: 'state', name: 'Status'},
      {prop: 'stats.numpg', name: 'PGs'},
      {prop: 'usedPercent', name: 'Usage'},
      {
        prop: 'stats_history.out_bytes',
        name: 'Read bytes',
        cellTransformation: CellTemplate.sparkline
      },
      {
        prop: 'stats_history.in_bytes',
        name: 'Writes bytes',
        cellTransformation: CellTemplate.sparkline
      },
      {prop: 'stats.op_r', name: 'Read ops', cellTransformation: CellTemplate.perSecond},
      {prop: 'stats.op_w', name: 'Write ops', cellTransformation: CellTemplate.perSecond}
    ];
  }

  getOsdList() {
    this.osdService.getList().subscribe((data: any[]) => {
      this.osds = data;
      data.map((osd) => {
        osd.stats_history.out_bytes = osd.stats_history.op_out_bytes.map(i => i[1]);
        osd.stats_history.in_bytes = osd.stats_history.op_in_bytes.map(i => i[1]);
        osd.usedPercent = this.dimlessPipe.transform(osd.stats.stat_bytes_used) + ' / ' +
          this.dimlessPipe.transform(osd.stats.stat_bytes);
        return osd;
      });
    });
  }
}
