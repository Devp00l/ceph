import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'cd-usage-bar',
  templateUrl: './usage-bar.component.html',
  styleUrls: ['./usage-bar.component.scss']
})
export class UsageBarComponent implements OnChanges {
  @Input()
  totalAmount: number;
  @Input()
  usedAmount: number;
  @Input()
  totalBytes: number;
  @Input()
  usedBytes: number;

  freeAmount: number;
  freeBytes: number;
  usedPercentage: number;
  freePercentage: number;

  ngOnChanges() {
    this.freeAmount = this.totalAmount - this.usedAmount;
    this.freeBytes = this.totalBytes - this.usedBytes;
    this.usedPercentage =
      this.totalAmount > 0
        ? Math.round((this.usedAmount / this.totalAmount) * 100)
        : Math.round((this.usedBytes / this.totalBytes) * 100);
    this.freePercentage = 100 - this.usedPercentage;
  }
}
