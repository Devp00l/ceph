import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { CdFormBuilder } from '../../../../shared/forms/cd-form-builder';
import { CdFormGroup } from '../../../../shared/forms/cd-form-group';
import { PrometheusSilenceMatcher } from '../../../../shared/models/prometheus-silence';
import { AlertmanagerAlert, PrometheusRule } from '../../../../shared/models/prometheus-alerts';
import * as _ from 'lodash';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { PrometheusSilenceMatcherService } from '../../../../shared/services/prometheus-silence-matcher.service';

@Component({
  selector: 'cd-silence-matcher-modal',
  templateUrl: './silence-matcher-modal.component.html',
  styleUrls: ['./silence-matcher-modal.component.scss']
})
export class SilenceMatcherModalComponent {
  /**
   * The event that is triggered when the 'Add' or 'Update' button
   * has been pressed.
   */
  @Output()
  submitAction = new EventEmitter();

  nameAttributes = ['alertname', 'instance', 'job', 'severity'];
  form: CdFormGroup;

  rules: PrometheusRule[]; // Will be set by silence form

  possibleValues: string[] = []; // Autocomplete possible values to match a rule

  matchesText = ''; // Will be set during value change
  matchesTextClass = ''; // Will be set during value change

  constructor(
    private i18n: I18n,
    private formBuilder: CdFormBuilder,
    private silenceMatcher: PrometheusSilenceMatcherService,
    public bsModalRef: BsModalRef
  ) {
    this.createForm();
  }

  createForm() {
    this.form = this.formBuilder.group({
      name: [null, [Validators.required]],
      value: [{ value: null, disabled: true }, [Validators.required]],
      isRegex: new FormControl(false)
    });
    this.form.get('name').valueChanges.subscribe((name) => {
      if (name === null) {
        this.form.get('value').disable();
        return;
      }
      this.setPossibleValues(name);
      this.form.get('value').enable();
    });
    this.form.get('value').valueChanges.subscribe((value) => {
      const values = this.form.value;
      values.value = value;
      this.updateMatchState(values);
    });
  }

  private setPossibleValues(name) {
    this.possibleValues = _.sortedUniq(
      this.rules.map((r) => _.get(r, this.silenceMatcher.getAttributePath(name))).filter((x) => x)
    );
  }

  private updateMatchState(values: PrometheusSilenceMatcher) {
    const match = this.silenceMatcher.singleMatch(values, this.rules);
    if (match) {
      this.matchesTextClass = match.cssClass;
      this.matchesText = match.status;
    }
  }

  preFillControls(matcher: PrometheusSilenceMatcher) {
    this.form.setValue(matcher);
  }

  onSubmit() {
    this.submitAction.emit(this.form.value);
    this.bsModalRef.hide();
  }
}
