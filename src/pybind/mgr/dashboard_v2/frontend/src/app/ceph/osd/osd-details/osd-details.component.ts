import { Component, Input, OnInit } from '@angular/core';
import { OsdService } from '../osd.service';

import * as _ from 'lodash';

@Component({
  selector: 'cd-osd-details',
  templateUrl: './osd-details.component.html',
  styleUrls: ['./osd-details.component.scss']
})
export class OsdDetailsComponent implements OnInit {
  @Input() selected?: any[];
  osdId: number;
  opWLatencyInBytesHistogram = {};
  opRLatencyOutBytesHistogram = {};
  osd = {};
  osdList = [];
  osdMetadataList = [];

  constructor(private osdService: OsdService) {}

  ngOnInit() {
    _.each(this.selected, (osd) => {
      this.refresh(osd);
    });
  }

  refresh(osd: any) {
    this.osdService.getDetails(osd.id).subscribe((data: any) => {
      osd.opWLatencyInBytesHistogram = data.osd_histogram.osd.op_w_latency_in_bytes_histogram;
      osd.opRLatencyOutBytesHistogram = data.osd_histogram.osd.op_r_latency_out_bytes_histogram;
      osd.osd = data.osd;
      const osdMetadata = data.osd_metadata;
      osd.osdMetadataList = [];
      osd.osdList = [];
      _.each(osdMetadata, (v, k) => {
        osd.osdMetadataList.push({
          key: k,
          value: v
        });
      });
      _.each(osd.osd, (v, k) => {
        osd.osdList.push({
          key: k,
          value: v
        });
      });
      setTimeout(() => {
        this.refresh(osd);
      }, 3000);
    });
  }
}
