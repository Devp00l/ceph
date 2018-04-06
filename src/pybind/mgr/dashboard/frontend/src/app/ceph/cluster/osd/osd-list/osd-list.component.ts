import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { OsdService } from '../../../../shared/api/osd.service';
import { CellTemplate } from '../../../../shared/enum/cell-template.enum';
import { CdTableColumn } from '../../../../shared/models/cd-table-column';
import { CdTableSelection } from '../../../../shared/models/cd-table-selection';
import { DimlessBinaryPipe } from '../../../../shared/pipes/dimless-binary.pipe';
import {
  DeletionModalComponent
} from '../../../../shared/components/deletion-modal/deletion-modal.component';

@Component({
  selector: 'cd-osd-list',
  templateUrl: './osd-list.component.html',
  styleUrls: ['./osd-list.component.scss']
})

export class OsdListComponent implements OnInit {
  @ViewChild('statusColor') statusColor: TemplateRef<any>;
  @ViewChild('osdUsageTpl') osdUsageTpl: TemplateRef<any>;
  @ViewChild('ctrlDescription') ctrlDescription: TemplateRef<any>;
  @ViewChild('modalDescription') modalDescription: TemplateRef<any>;
  someData = [1, 2, 3, 4, 5];
  finished: number[];
  ctrlRef: BsModalRef;
  modalRef: BsModalRef;

  constructor(
    private osdService: OsdService,
    private dimlessBinaryPipe: DimlessBinaryPipe,
    private modalService: BsModalService) {}

  openModal(metaType, pattern, description: TemplateRef<any>) {
    const ref: BsModalRef = this.modalService.show(DeletionModalComponent);
    ref.content.metaType = metaType;
    ref.content.pattern = pattern;
    ref.content.description = description;
    ref.content.modalRef = ref;
    return ref;
  }

  openCtrlDriven() {
    this.ctrlRef = this.openModal('Controller delete handling', 'ctrl-test', this.ctrlDescription);
    this.ctrlRef.content.deletionMethod = this.fakeDeleteController.bind(this);
  }

  openModalDriven() {
    this.modalRef = this.openModal('Modal delete handling', 'modal-test', this.modalDescription);
    this.modalRef.content.deletionObserver = this.fakeDelete();
  }

  finish() {
    this.finished = [6, 7, 8, 9];
  }

  fakeDelete() {
    return (): Observable<any> => {
      return new Observable((observer: Subscriber<any>) => {
        Observable.timer(100).subscribe(() => {
          observer.next(this.finish());
          observer.complete();
        });
      });
    };
  }

  fakeDeleteController() {
    Observable.timer(100).subscribe(() => {
      this.finish();
      this.ctrlRef.hide();
    });
  }

  osds = [];
  columns: CdTableColumn[];
  selection = new CdTableSelection();

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

  beforeShowDetails(selection: CdTableSelection) {
    return selection.hasSingleSelection;
  }
}
