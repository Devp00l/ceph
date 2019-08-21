import { Component, Input, OnChanges, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { I18n } from '@ngx-translate/i18n-polyfill';
import * as _ from 'lodash';

import { CdTableFetchDataContext } from 'app/shared/models/cd-table-fetch-data-context';
import { CephfsService } from '../../../shared/api/cephfs.service';
import { CdTableColumn } from '../../../shared/models/cd-table-column';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import {
  CephfsDir,
  CephfsQuotas,
  CephfsSnapshot
} from '../../../shared/models/cephfs-directory-models';
import { CdDatePipe } from '../../../shared/pipes/cd-date.pipe';
import { DimlessBinaryPipe } from '../../../shared/pipes/dimless-binary.pipe';
import { TimeDiffService } from '../../../shared/services/time-diff.service';

@Component({
  selector: 'cd-cephfs-directories',
  templateUrl: './cephfs-directories.component.html',
  styleUrls: ['./cephfs-directories.component.scss']
})
export class CephfsDirectoriesComponent implements OnInit, OnChanges {
  @ViewChild('quotas', { static: true })
  quotas: TemplateRef<any>;
  @ViewChild('snapshots', { static: true })
  snapshots: TemplateRef<any>;

  @Input()
  id: number;
  @Input()
  path?: string;

  dirs: CephfsDir[];
  columns: CdTableColumn[];
  selection = new CdTableSelection();
  selectedPath: string;

  constructor(
    private cephfsService: CephfsService,
    private i18n: I18n,
    private dimlessBinaryPipe: DimlessBinaryPipe,
    private timeDiffService: TimeDiffService,
    private datePipe: CdDatePipe
  ) {}

  ngOnInit() {
    this.columns = [
      {
        name: this.i18n('Name'),
        prop: 'name',
        flexGrow: 2
      },
      {
        name: this.i18n('Path'),
        prop: 'path',
        flexGrow: 4
      },
      {
        name: this.i18n('Quotas'),
        prop: 'quotas',
        sortable: false,
        cellTemplate: this.quotas,
        flexGrow: 2
      },
      {
        name: this.i18n('Snapshots'),
        prop: 'snapshots',
        cellTemplate: this.snapshots,
        sortable: false,
        flexGrow: 2
      }
    ];
  }

  ngOnChanges() {
    this.getDirList();
  }

  getDirList(context?: CdTableFetchDataContext) {
    if (!_.isNumber(this.id)) {
      return;
    }
    this.cephfsService
      .lsDir(this.id, this.path)
      .subscribe((data) => (this.dirs = data), () => context && context.error());
  }

  displayQuotas(quotas: CephfsQuotas): string {
    const text: string[] = [];
    if (quotas.max_bytes > 0) {
      text.push(this.i18n('Max size') + ' ' + this.dimlessBinaryPipe.transform(quotas.max_bytes));
    }
    if (quotas.max_files > 0) {
      text.push(this.i18n('Max files') + ' ' + quotas.max_files);
    }
    return text.join(', ');
  }

  displaySnapshots(snapshots: CephfsSnapshot[]): string {
    if (snapshots.length === 0) {
      return '';
    }
    const lastCreation = snapshots
      .map((snapshot) => new Date(snapshot.created))
      .reduce((prev, cur) => (prev > cur ? prev : cur));
    const duration = this.timeDiffService.calculateDuration(lastCreation, new Date());
    return `${this.datePipe.transform(+lastCreation)} (${duration} ${this.i18n('ago')})`;
  }

  updateSelection(selection: CdTableSelection) {
    this.selection = selection;
    const selected = selection.first();
    if (selected) {
      this.selectedPath = selected.path;
    }
  }

  getTabHeading(): string {
    return `${this.i18n('Directories in')} ${this.selectedPath}`;
  }
}
