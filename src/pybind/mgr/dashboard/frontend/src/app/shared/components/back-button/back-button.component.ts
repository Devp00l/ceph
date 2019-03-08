import { Location } from '@angular/common';
import { Component, Input } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'cd-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})
export class BackButtonComponent {
  @Input() customBack: Function;
  @Input() customName: string;

  constructor(private location: Location, private i18n: I18n) {}

  name() {
    return this.customName || this.i18n('Back');
  }

  back() {
    this.customBack ? this.customBack() : this.location.back();
  }
}
