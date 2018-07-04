import { Component, OnChanges } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'cd-select-badges',
  templateUrl: './select-badges.component.html',
  styleUrls: ['./select-badges.component.scss']
})
export class SelectBadgesComponent implements OnChanges {
  @Input() data: Array<string> = [];
  @Input() options: Array<SelectBadgesOption> = [];
  @Input() emptyMessage = 'There are no items.';

  constructor() {}

  ngOnChanges() {
    if (this.data.length > 0) {
      this.options.forEach((option) => {
        if (this.data.indexOf(option.name) !== -1) {
          option.selected = true;
        }
      });
    }
  }

  private updateOptions() {
    this.data = this.options.filter(option => option.selected).map(option => option.name);
  }

  selectOption(option: SelectBadgesOption) {
    option.selected = !option.selected;
    this.updateOptions();
  }

  removeItem(item: string) {
    const optionToRemove = this.options.find((option: SelectBadgesOption) => {
      return option.name === item;
    });
    optionToRemove.selected = false;
    this.updateOptions();
  }
}
