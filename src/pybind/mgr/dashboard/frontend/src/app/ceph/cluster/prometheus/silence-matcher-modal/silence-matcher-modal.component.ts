import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { CdFormBuilder } from '../../../../shared/forms/cd-form-builder';
import { CdFormGroup } from '../../../../shared/forms/cd-form-group';
import { PrometheusSilenceMatcher } from '../../../../shared/models/prometheus-silence';
import { AlertmanagerAlert, PrometheusRule } from '../../../../shared/models/prometheus-alerts';
import * as _ from 'lodash';

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

  alerts: AlertmanagerAlert[]; // Will be set by silence form
  rules: PrometheusRule[]; // Will be set by silence form

  possibleValues: string[] = []; // Autocomplete possible values to match a rule

  matchedRules = 0; // Will be set during value change
  matchedAlerts = 0; // Will be set during value change

  constructor(private formBuilder: CdFormBuilder, public bsModalRef: BsModalRef) {
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
      this.setPossibleValues();
      this.form.get('value').enable();
    });
    this.form.get('value').valueChanges.subscribe((name) => {
      this.matches();
    });
  }

  matches() {
    if (this.form.getValue('isRegex')) {
      return;
    }
    const value = this.form.getValue('value');
    const attributePath = this.getAttributePath();

    const rules = this.rules.filter((r) => _.get(r, attributePath) === value).filter((x) => x);
    this.matchedRules = rules.length;

    let activeAlerts = 0;
    rules.forEach((r) => (activeAlerts += r.alerts.length));
    this.matchedAlerts = activeAlerts;
  }

  setPossibleValues() {
    this.possibleValues = _.sortedUniq(
      this.rules.map((r) => _.get(r, this.getAttributePath())).filter((x) => x)
    );
  }

  getAttributePath() {
    const getValues = {
      alertname: 'name',
      instance: 'alerts.0.labels.instance',
      job: 'alerts.0.labels.job',
      severity: 'labels.severity'
    };
    return getValues[this.form.getValue('name')];
  }

  preFillControls(matcher: PrometheusSilenceMatcher) {
    this.form.setValue(matcher);
  }

  onSubmit() {
    this.submitAction.emit(this.form.value);
    this.bsModalRef.hide();
  }
}
