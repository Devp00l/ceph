import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'cd-submit-button',
  templateUrl: './submit-button.component.html',
  styleUrls: ['./submit-button.component.scss']
})
export class SubmitButtonComponent {
  @Input() loading: boolean;
  @Output() submitAction = new EventEmitter();
}
