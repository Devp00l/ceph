import { Component, Input, OnChanges, OnInit } from '@angular/core';

import * as _ from 'underscore';

@Component({
  selector: 'cd-osd-performance-histogram',
  templateUrl: './osd-performance-histogram.component.html',
  styleUrls: ['./osd-performance-histogram.component.scss']
})
export class OsdPerformanceHistogramComponent implements OnInit, OnChanges {
  @Input() histogram: any;
  valuesStyle: any;
  last = {};

  constructor() { }

  ngOnInit() {
  }
  ngOnChanges() {
    console.log('# ngOnChanges:');
    console.log(this.histogram);
    this.render();
  }

  hexdigits(v): string {
    const i = Math.floor(v * 255);
    if (Math.floor(i) < 0x10) {
      return '0' + Math.floor(i).toString(16);
    } else {
      return Math.floor(i).toString(16);
    }
  }

  hexcolor(r, g, b) {
    return '#' + this.hexdigits(r) + this.hexdigits(g) + this.hexdigits(b);
  }

  render() {
    // var data = contentData.osd_histogram.osd[counter];
    // var hist_table = $(element);
    // hist_table.empty();
    let sum = 0.0;
    let max = 0.0;

    _.each(this.histogram.values, (row, i) => {
      _.each(row, (col, j) => {
        let val;
        if (!this.last) {
          val = col;
        } else {
          val = col - this.last[i][j];
        }
        sum += val;
        max = Math.max(max, val);
      });
    });

    const values = [];
    _.each(this.histogram.values, (row, i) => {
      values[i] = new Array(row.length);
      _.each(row, (col, j) => {
        let val;
        if (!this.last) {
          val = col;
        } else {
          val = col - this.last[i][j];
        }
        let g;
        if (max) {
          g = (val / max);
        } else {
          g = 0.0;
        }
        const r = 1.0 - g;
        const b = 0.0;
        values[i][j] = {backgroundColor: this.hexcolor(r, g, b)};
      });
    });

    this.valuesStyle = values;
    this.last = this.histogram.values;
  }
}
