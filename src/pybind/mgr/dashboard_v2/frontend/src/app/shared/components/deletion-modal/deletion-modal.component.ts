import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';

@Component({
  selector: 'cd-deletion-modal',
  templateUrl: './deletion-modal.component.html',
  styleUrls: ['./deletion-modal.component.scss']
})
export class DeletionModalComponent implements OnInit {
  @Input() metaType: string;
  @Input() pattern: string;
  @Input() btnClasses = 'btn btn-primary';
  @Output() toggleDeletion = new EventEmitter();
  bsModalRef: BsModalRef;
  deletionForm: FormGroup;
  confirmation: FormControl;

  constructor(private modalService: BsModalService) {}

  invalidControl (control: FormControl, error?: string) {
    return control.dirty && control.invalid && (error ? control.errors[error] : true);
  }

  ngOnInit() {
    this.confirmation = new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern(this.pattern)
      ],
      updateOn: 'blur'
    });
    this.deletionForm = new FormGroup({
      confirmation: this.confirmation
    });
  }

  delete() {
    if (this.confirmation.valid) {
      this.toggleDeletion.emit();
      this.bsModalRef.hide();
    } else if (!this.confirmation.dirty) {
      this.confirmation.markAsDirty();
    }
  }

  openModal(template: TemplateRef<any>) {
    this.deletionForm.reset();
    this.bsModalRef = this.modalService.show(template);
  }
}
