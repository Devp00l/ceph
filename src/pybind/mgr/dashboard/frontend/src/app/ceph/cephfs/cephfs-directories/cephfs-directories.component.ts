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
import { TableComponent } from '../../../shared/datatable/table/table.component';

@Component({
  selector: 'cd-cephfs-directories',
  templateUrl: './cephfs-directories.component.html',
  styleUrls: ['./cephfs-directories.component.scss']
})
export class CephfsDirectoriesComponent implements OnInit, OnChanges {
  @ViewChild(TableComponent, { static: true })
  table: TableComponent;
  @ViewChild('quotas', { static: true })
  quotas: TemplateRef<any>;
  @ViewChild('snapshots', { static: true })
  snapshots: TemplateRef<any>;

  @Input()
  id: number;
  @Input()
  path?: string;

  selectedPath: string;
  context: CdTableFetchDataContext;

  dirs: CephfsDir[] = [];
  columns: CdTableColumn[] = [];
  justFetched: string[] = [];
  pathList: string[] = ['/'];
  selection = new CdTableSelection();
  treeView = {
    relation: 'parent',
    action: (e) => this.onTreeAction(e)
  };

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
        name: this.i18n('Path'),
        prop: 'path',
        isTreeColumn: true,
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
    this.pathList = ['/'];
  }

  updateDirList(context?: CdTableFetchDataContext) {
    if (!_.isNumber(this.id)) {
      return;
    }
    this.dirs = [];
    this.justFetched = [];
    this.pathList.forEach((path) => this.getDirectory(path, this.pathList.length === 1, context));
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
      this.getDirectory(selected.path);
    }
  }

  getDirectory(path: string, deep = true, context?: CdTableFetchDataContext) {
    if (context) {
      this.context = context;
    }
    if (!this.pathList.includes(path)) {
      this.pathList.push(path);
    }
    if (this.justFetched.includes(path)) {
      if (deep) {
        this.dirs
          .filter((dir) => dir.parent === path)
          .forEach((dir) => this.getDirectory(dir.path, false));
      }
      return;
    }
    this.justFetched.push(path);
    this.cephfsService
      .lsDir(this.id, path)
      .subscribe((data) => this.updateDirs(deep, data), () => this.context && this.context.error());
  }

  private updateDirs(deep: boolean, data: CephfsDir[]) {
    //export type TreeStatus = 'collapsed' | 'expanded' | 'loading' | 'disabled';
    data.forEach((dir) => (dir.treeStatus = 'loading'));
    if (deep) {
      data.forEach((dir) => this.getDirectory(dir.path, false));
    }
    const dirs = _.uniqBy(this.dirs.concat(data), 'path');
    //const dirs = this.dirs.concat(data);
    this.updateDirTreeStatus(dirs);
    this.dirs = dirs;
  }

  private updateDirTreeStatus(dirs: CephfsDir[]) {
    dirs.forEach((dir) => {
      const status = dir.treeStatus;
      if (dirs.some((d) => d.parent === dir.path)) {
        if (['loading', 'disabled'].includes(status)) {
          dir.treeStatus = 'collapsed';
        }
      } else {
        if (status !== 'disabled') {
          dir.treeStatus = 'disabled';
        }
      }
    });
  }

  onTreeAction(event: any) {
    const dir: CephfsDir = event.row;
    this.triggerTreeStatus(dir);
    this.table.selection.selected = [dir];
    this.table.onSelect();
  }

  private triggerTreeStatus(dir: CephfsDir) {
    if (dir.treeStatus === 'collapsed') {
      dir.treeStatus = 'expanded';
    } else if (dir.treeStatus === 'expanded') {
      dir.treeStatus = 'collapsed';
    }
  }
}
