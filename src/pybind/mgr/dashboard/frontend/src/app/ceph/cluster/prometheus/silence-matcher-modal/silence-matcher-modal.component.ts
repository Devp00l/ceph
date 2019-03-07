import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { CdFormBuilder } from '../../../../shared/forms/cd-form-builder';
import { CdFormGroup } from '../../../../shared/forms/cd-form-group';
import { PrometheusSilenceMatcher } from '../../../../shared/models/prometheus-silence';
import { AlertmanagerAlert, PrometheusRule } from '../../../../shared/models/prometheus-alerts';
import * as _ from 'lodash';
import { I18n } from '@ngx-translate/i18n-polyfill';

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

  matchedRules = 0; // Will be set during value change
  matchedAlerts = 0; // Will be set during value change
  matchesText = ''; // Will be set during value change
  matchesTextClass = ''; // Will be set during value change

  constructor(
    private i18n: I18n,
    private formBuilder: CdFormBuilder,
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
      this.setPossibleValues();
      this.form.get('value').enable();
    });
    this.form.get('value').valueChanges.subscribe((value) => {
      this.determineMatch(value);
    });
  }

  private setPossibleValues() {
    this.possibleValues = _.sortedUniq(
      this.rules.map((r) => _.get(r, this.getAttributePath())).filter((x) => x)
    );
  }

  private getAttributePath() {
    const getValues = {
      alertname: 'name',
      instance: 'alerts.0.labels.instance',
      job: 'alerts.0.labels.job',
      severity: 'labels.severity'
    };
    return getValues[this.form.getValue('name')];
  }

  private determineMatch(value: string) {
    if (this.form.getValue('isRegex')) {
      return;
    }
    const attributePath = this.getAttributePath();
    const rules = this.rules.filter((r) => _.get(r, attributePath) === value).filter((x) => x);

    let activeAlerts = 0;
    rules.forEach((r) => (activeAlerts += r.alerts.length));

    this.updateMatchState(rules.length, activeAlerts);
  }

  private updateMatchState(rules, alerts) {
    this.matchedRules = rules;
    this.matchedAlerts = alerts;
    this.matchesTextClass = alerts ? 'has-success' : 'has-warning';
    this.matchesText = this.getMatchText(rules, alerts);
  }

  private getMatchText(rules, alerts) {
    const msg = {
      noRule: this.i18n('Your matcher seems to match no currently defined rule or active alert.'),
      noAlerts: this.i18n('no active alerts'),
      alert: this.i18n('1 active alert'),
      alerts: this.i18n('{{n}} active alerts', { n: alerts }),
      rule: this.i18n('Matches 1 rule'),
      rules: this.i18n('Matches {{n}} rules', { n: rules })
    };
    return rules ? (this.i18n('{{rules}} with {{alerts}}.', {
      rules: rules > 1 ? msg.rules : msg.rule,
      alerts: alerts ? (alerts > 1 ? msg.alerts : msg.alert) : msg.noAlerts
    })) : msg.noRule;
  }

  preFillControls(matcher: PrometheusSilenceMatcher) {
    this.form.setValue(matcher);
  }

  onSubmit() {
    this.submitAction.emit(this.form.value);
    this.bsModalRef.hide();
  }
}
