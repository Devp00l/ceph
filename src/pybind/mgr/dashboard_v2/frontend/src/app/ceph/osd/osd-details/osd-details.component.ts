import { Component, Input, OnInit } from '@angular/core';
import {OsdService} from '../osd.service';

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
    _.each(this.selected, (osd)=>{});
    this.refresh();
  }

  refresh() {
    this.osdService.getDetails(this.osdId).subscribe((data: any) => {
      this.opWLatencyInBytesHistogram = data.osd_histogram.osd.op_w_latency_in_bytes_histogram;
      this.opRLatencyOutBytesHistogram = data.osd_histogram.osd.op_r_latency_out_bytes_histogram;
      this.osd = data.osd;
      const osdMetadata = data.osd_metadata;
      this.osdMetadataList = [];
      this.osdList = [];
      _.each(osdMetadata, (v, k) => {
        this.osdMetadataList.push({
          key: k,
          value: v
        });
      });
      _.each(this.osd, (v, k) => {
        this.osdList.push({
          key: k,
          value: v
        });
      });
      setTimeout(() => {
        this.refresh();
      }, 3000);
    });
  }
}
