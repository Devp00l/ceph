import {
  Component, OnInit, TemplateRef, ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Observable } from 'rxjs/Observable';

import { SubmitButtonComponent } from '../submit-button/submit-button.component';

@Component({
  selector: 'cd-deletion-modal',
  templateUrl: './deletion-modal.component.html',
  styleUrls: ['./deletion-modal.component.scss']
})
export class DeletionModalComponent implements OnInit {
  @ViewChild(SubmitButtonComponent) submitButton: SubmitButtonComponent;
  description: TemplateRef<any>;
  metaType: string;
  pattern: 'yes';
  deletionObserver: () => Observable<any>;
  deletionMethod: Function;
  modalRef: BsModalRef;

  deletionForm: FormGroup;
  confirmation: FormControl;

  ngOnInit() {
    this.confirmation = new FormControl('', {
      validators: [
        Validators.required
      ],
      updateOn: 'blur'
    });
    this.deletionForm = new FormGroup({
      confirmation: this.confirmation
    });
  }

  invalidControl(submitted: boolean, error?: string): boolean {
    const control = this.confirmation;
    return !!(
      (submitted || control.dirty) &&
      control.invalid &&
      (error ? control.errors[error] : true)
    );
  }

  updateConfirmation($e) {
    if ($e.key !== 'Enter') {
      return;
    }
    this.confirmation.setValue($e.target.value);
    this.confirmation.markAsDirty();
    this.confirmation.updateValueAndValidity();
  }

  delete () {
    this.submitButton.submit();
  }

  deletionCall() {
    if (this.deletionObserver) {
      this.deletionObserver().subscribe(
        undefined,
        this.stopLoadingSpinner.bind(this),
        this.hideModal.bind(this)
      );
    } else {
      this.deletionMethod();
    }
  }

  hideModal() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  stopLoadingSpinner() {
    this.submitButton.loading = false;
  }
}
