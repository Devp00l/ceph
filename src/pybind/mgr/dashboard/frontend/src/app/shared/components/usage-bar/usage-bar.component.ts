import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'cd-usage-bar',
  templateUrl: './usage-bar.component.html',
  styleUrls: ['./usage-bar.component.scss']
})
export class UsageBarComponent implements OnChanges {
  @Input()
  total: number;
  @Input()
  used: number;
  @Input()
  isBinary = true;

  free: number;
  usedPercentage: number;
  freePercentage: number;

  ngOnChanges() {
    this.free = this.total - this.used;
    this.usedPercentage = Math.round((this.used / this.total) * 100);
    this.freePercentage = 100 - this.usedPercentage;
  }
}
