import { Component, Input, OnChanges } from '@angular/core';

import { I18n } from '@ngx-translate/i18n-polyfill';
import * as _ from 'lodash';

import { PoolService } from '../../../shared/api/pool.service';
import { CdTableColumn } from '../../../shared/models/cd-table-column';
import { RbdConfigurationEntry } from '../../../shared/models/configuration';
import { Permissions } from '../../../shared/models/permissions';

@Component({
  selector: 'cd-pool-details',
  templateUrl: './pool-details.component.html',
  styleUrls: ['./pool-details.component.scss']
})
export class PoolDetailsComponent implements OnChanges {
  cacheTierColumns: Array<CdTableColumn> = [];

  @Input()
  selection: any;
  @Input()
  permissions: Permissions;
  @Input()
  cacheTiers: any[];
  selectedPoolConfiguration: RbdConfigurationEntry[];
  filteredNonPoolData: object;

  constructor(private i18n: I18n, private poolService: PoolService) {
    this.cacheTierColumns = [
      {
        prop: 'pool_name',
        name: this.i18n('Name'),
        flexGrow: 3
      },
      {
        prop: 'cache_mode',
        name: this.i18n('Cache Mode'),
        flexGrow: 2
      },
      {
        prop: 'cache_min_evict_age',
        name: this.i18n('Min Evict Age'),
        flexGrow: 2
      },
      {
        prop: 'cache_min_flush_age',
        name: this.i18n('Min Flush Age'),
        flexGrow: 2
      },
      {
        prop: 'target_max_bytes',
        name: this.i18n('Target Max Bytes'),
        flexGrow: 2
      },
      {
        prop: 'target_max_objects',
        name: this.i18n('Target Max Objects'),
        flexGrow: 2
      }
    ];
  }

  hasTiers: boolean;
  isReplicated: boolean;
  grafanaPath: string;

  private hasChanged(publicVarName: string, data: any) {
    if (!_.isEqual(data, this[publicVarName])) {
      console.log(publicVarName, 'has changed');
      this[publicVarName] = data;
    }
  }

  ngOnChanges() {
    if (this.selection) {
      console.log('selection has changed - at least I think so');
      this.poolService.getConfiguration(this.selection.pool_name).subscribe((poolConf) => {
        this.hasChanged('selectedPoolConfiguration', poolConf);
      });
      this.hasChanged('filteredNonPoolData', _.omit(this.selection, ['cdExecuting', 'cdIsBinary']));
      this.hasChanged('hasTiers', this.selection['tiers'].length > 0);
      this.hasChanged('isReplicated', this.selection['type'] === 'replicated');
      this.hasChanged(
        'grafanaPath',
        'ceph-pool-detail?var-pool_name=' + this.selection['pool_name']
      );
    }
  }
}
