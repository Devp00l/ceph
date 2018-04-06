import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { timeout } from 'q';
import 'rxjs/add/observable/zip';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { OsdService } from '../../../../shared/api/osd.service';
import {
  DeletionButtonComponent
} from '../../../../shared/components/deletion-button/deletion-button.component';
import { CellTemplate } from '../../../../shared/enum/cell-template.enum';
import { CdTableColumn } from '../../../../shared/models/cd-table-column';
import { CdTableSelection } from '../../../../shared/models/cd-table-selection';
import { DimlessBinaryPipe } from '../../../../shared/pipes/dimless-binary.pipe';

@Component({
  selector: 'cd-osd-list',
  templateUrl: './osd-list.component.html',
  styleUrls: ['./osd-list.component.scss']
})

export class OsdListComponent implements OnInit {
  @ViewChild(DeletionButtonComponent) deleteButton: DeletionButtonComponent;
  @ViewChild('statusColor') statusColor: TemplateRef<any>;
  @ViewChild('osdUsageTpl') osdUsageTpl: TemplateRef<any>;

  osds = [];
  columns: CdTableColumn[];
  selection = new CdTableSelection();

  constructor(
    private osdService: OsdService,
    private dimlessBinaryPipe: DimlessBinaryPipe
  ) { }

  ngOnInit() {
    this.columns = [
      {prop: 'host.name', name: 'Host'},
      {prop: 'id', name: 'ID', cellTransformation: CellTemplate.bold},
      {prop: 'collectedStates', name: 'Status', cellTemplate: this.statusColor},
      {prop: 'stats.numpg', name: 'PGs'},
      {prop: 'stats.stat_bytes', name: 'Size', pipe: this.dimlessBinaryPipe},
      {name: 'Usage', cellTemplate: this.osdUsageTpl},
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

  updateSelection(selection: CdTableSelection) {
    this.selection = selection;
  }

  getOsdList() {
    this.osdService.getList().subscribe((data: any[]) => {
      this.osds = data;
      data.map((osd) => {
        osd.collectedStates = this.collectStates(osd);
        osd.stats_history.out_bytes = osd.stats_history.op_out_bytes.map(i => i[1]);
        osd.stats_history.in_bytes = osd.stats_history.op_in_bytes.map(i => i[1]);
        return osd;
      });
    });
  }

  collectStates(osd) {
    const select = (onState, offState) => osd[onState] ? onState : offState;
    return [select('up', 'down'), select('in', 'out')];
  }

  fakeDelete() {
    return (): Observable => {
      const first = Observable.timer(1000);
      const second = Observable.create((observer: Observer) => {
        const x = () => console.log('fake modal delete', this.osds);
        observer.next(x());
        observer.complete();
      });
      const fin = Observable.zip(first, second);
      console.log(fin);
      return fin;
    };
  }

  fakeDeleteController() {
    Observable.timer(1000).subscribe(() => {
      console.log('fake controller delete', this.osds);
      this.deleteButton.stopLoadingSpinner();
    });
  }

  beforeShowDetails(selection: CdTableSelection) {
    return selection.hasSingleSelection;
  }
}
