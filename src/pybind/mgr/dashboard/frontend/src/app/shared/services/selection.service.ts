import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { ServicesModule } from './services.module';

@Injectable({
  providedIn: ServicesModule
})
export class SelectionService {
  hasMultiSelection: boolean;
  hasSingleSelection: boolean;
  hasSelection: boolean;
  selected: any[] = [];
  selectObserver = new BehaviorSubject(null);

  constructor() {
    this.update();
  }

  /**
   * Clears any selection
   */
  clear() {
    this.selected.splice(0, this.selected.length);
    this.update();
  }

  updateWith(selection: any[]) {
    this.clear();
    selection.forEach((s) => this.selected.push(s));
    this.update();
  }

  /**
   * Recalculate the variables based on the current number
   * of selected rows.
   */
  update() {
    this.hasSelection = this.selected.length > 0;
    this.hasSingleSelection = this.selected.length === 1;
    this.hasMultiSelection = this.selected.length > 1;
    this.selectObserver.next(this.selected);
  }

  /**
   * Get the first selected row.
   * @return {any | null}
   */
  first() {
    return this.hasSelection ? this.selected[0] : null;
  }
}
