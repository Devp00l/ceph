import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';

import { ChartDataSets, ChartOptions, ChartPoint } from 'chart.js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { ChartTooltip } from '../../../shared/models/chart-tooltip';

@Component({
  selector: 'cd-cephfs-chart',
  templateUrl: './cephfs-chart.component.html',
  styleUrls: ['./cephfs-chart.component.scss']
})
export class CephfsChartComponent implements OnChanges, OnInit {
  @ViewChild('chartCanvas', { static: true })
  chartCanvas: ElementRef;
  @ViewChild('chartTooltip', { static: true })
  chartTooltip: ElementRef;

  @Input()
  mdsCounter: any;

  lhsCounter = 'mds_mem.ino';
  rhsCounter = 'mds_server.handle_client_request';

  chart = {
    datasets: [
      {
        label: this.lhsCounter,
        yAxisID: 'LHS',
        data: [] as ChartPoint[],
        lineTension: 0.1
      },
      {
        label: this.rhsCounter,
        yAxisID: 'RHS',
        data: [] as ChartPoint[],
        lineTension: 0.1
      }
    ] as ChartDataSets[],
    options: {
      title: {
        text: '',
        display: true
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: 'top'
      },
      scales: {
        xAxes: [
          {
            position: 'top',
            type: 'time',
            time: {
              displayFormats: {
                quarter: 'MMM YYYY'
              }
            },
            ticks: {
              maxRotation: 0
            }
          }
        ],
        yAxes: [
          {
            id: 'LHS',
            type: 'linear',
            position: 'left'
          },
          {
            id: 'RHS',
            type: 'linear',
            position: 'right'
          }
        ]
      },
      tooltips: {
        enabled: false,
        mode: 'index',
        intersect: false,
        position: 'nearest',
        callbacks: {
          // Pick the Unix timestamp of the first tooltip item.
          title: function(tooltipItems, data): string {
            let ts = 0;
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              const point = data.datasets[item.datasetIndex].data[item.index] as ChartPoint;
              ts = point.x as number;
            }
            return ts.toString();
          }
        }
      }
    } as ChartOptions,
    chartType: 'line'
  };

  constructor() {}

  ngOnInit() {
    if (_.isUndefined(this.mdsCounter)) {
      return;
    }
    this.setChartTooltip();
    this.updateChart();
  }

  ngOnChanges() {
    if (_.isUndefined(this.mdsCounter)) {
      return;
    }
    this.updateChart();
  }

  private setChartTooltip() {
    const chartTooltip = new ChartTooltip(
      this.chartCanvas,
      this.chartTooltip,
      (tooltip) => tooltip.caretX + 'px',
      (tooltip) => tooltip.caretY - tooltip.height - 15 + 'px'
    );
    chartTooltip.getTitle = (ts) => moment(ts, 'x').format('LTS');
    chartTooltip.checkOffset = true;
    _.merge(this.chart, {
      options: {
        title: {
          text: this.mdsCounter.name
        },
        tooltips: {
          custom: (tooltip) => {
            chartTooltip.customTooltips(tooltip);
          }
        }
      } as ChartOptions
    });
  }

  private updateChart() {
    _.merge(this.chart, {
      datasets: [
        {
          data: this.convert_timeseries(this.mdsCounter[this.lhsCounter])
        },
        {
          data: this.delta_timeseries(this.mdsCounter[this.rhsCounter])
        }
      ] as ChartDataSets[]
    });
    this.chart.datasets = [...this.chart.datasets]; // Force angular to update
  }

  // Convert ceph-mgr's time series format (list of 2-tuples
  // with seconds-since-epoch timestamps) into what chart.js
  // can handle (list of objects with millisecs-since-epoch
  // timestamps)
  private convert_timeseries(sourceSeries) {
    const data = [];
    _.each(sourceSeries, (dp) => {
      data.push({
        x: dp[0] * 1000,
        y: dp[1]
      });
    });

    return data;
  }

  private delta_timeseries(sourceSeries) {
    let i;
    let prev = sourceSeries[0];
    const result = [];
    for (i = 1; i < sourceSeries.length; i++) {
      const cur = sourceSeries[i];
      const tdelta = cur[0] - prev[0];
      const vdelta = cur[1] - prev[1];
      const rate = vdelta / tdelta;

      result.push({
        x: cur[0] * 1000,
        y: rate
      });

      prev = cur;
    }
    return result;
  }
}
