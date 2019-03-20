import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { CellTemplate } from '../../../../shared/enum/cell-template.enum';
import { CdTableAction } from '../../../../shared/models/cd-table-action';
import { CdTableColumn } from '../../../../shared/models/cd-table-column';
import { Permission } from '../../../../shared/models/permissions';
import { CdDatePipe } from '../../../../shared/pipes/cd-date.pipe';
import { AuthStorageService } from '../../../../shared/services/auth-storage.service';
import { PrometheusAlertService } from '../../../../shared/services/prometheus-alert.service';
import { SelectionService } from '../../../../shared/services/selection.service';

@Component({
  selector: 'cd-prometheus-list',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss']
})
export class AlertListComponent implements OnInit {
  @ViewChild('externalLinkTpl')
  externalLinkTpl: TemplateRef<any>;
  columns: CdTableColumn[];
  tableActions: CdTableAction[];
  permission: Permission;
  customCss = {
    'label label-danger': 'active',
    'label label-warning': 'unprocessed',
    'label label-info': 'suppressed'
  };

  constructor(
    // NotificationsComponent will refresh all alerts every 5s (No need to do it here as well)
    private authStorageService: AuthStorageService,
    public prometheusAlertService: PrometheusAlertService,
    private i18n: I18n,
    public selection: SelectionService,
    private cdDatePipe: CdDatePipe
  ) {
    this.permission = this.authStorageService.getPermissions().prometheus;
  }

  ngOnInit() {
    this.tableActions = [
      {
        permission: 'create',
        canBePrimary: (selection) =>
          selection.hasSingleSelection && selection.first().status.state === 'expired',
        disable: (selection) =>
          !selection.hasSingleSelection || selection.first().cdExecuting,
        icon: 'fa-plus',
        routerLink: () => ['/silence/add', this.selection.first().labels],
        name: this.i18n('Create silence')
      }
    ];
    this.columns = [
      {
        name: this.i18n('Name'),
        prop: 'labels.alertname',
        flexGrow: 2
      },
      {
        name: this.i18n('Job'),
        prop: 'labels.job',
        flexGrow: 2
      },
      {
        name: this.i18n('Severity'),
        prop: 'labels.severity'
      },
      {
        name: this.i18n('State'),
        prop: 'status.state',
        cellTransformation: CellTemplate.classAdding
      },
      {
        name: this.i18n('Started'),
        prop: 'startsAt',
        pipe: this.cdDatePipe
      },
      {
        name: this.i18n('URL'),
        prop: 'generatorURL',
        sortable: false,
        cellTemplate: this.externalLinkTpl
      }
    ];
  }
}
