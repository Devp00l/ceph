import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import {
  configureTestBed,
  FixtureHelper,
  FormHelper,
  i18nProviders,
  PrometheusHelper
} from '../../../../../testing/unit-test-helper';
import { SharedModule } from '../../../../shared/shared.module';
import { SilenceMatcherModalComponent } from './silence-matcher-modal.component';

describe('SilenceMatcherModalComponent', () => {
  let component: SilenceMatcherModalComponent;
  let fixture: ComponentFixture<SilenceMatcherModalComponent>;
  let formH: FormHelper;
  let fixtureH: FixtureHelper;
  let prometheus: PrometheusHelper;

  configureTestBed({
    declarations: [SilenceMatcherModalComponent],
    imports: [
      HttpClientTestingModule,
      SharedModule,
      ReactiveFormsModule,
      TypeaheadModule.forRoot(),
      RouterTestingModule
    ],
    providers: [BsModalRef, i18nProviders]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SilenceMatcherModalComponent);
    fixtureH = new FixtureHelper(fixture);
    component = fixture.componentInstance;
    formH = new FormHelper(component.form);

    prometheus = new PrometheusHelper();
    component.rules = [
      prometheus.createRule('alert0', 'someSeverity', [prometheus.createAlert('alert0')]),
      prometheus.createRule('alert1', 'someSeverity', [])
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a name field', () => {
    formH.expectError('name', 'required');
    formH.expectValidChange('name', 'alertname');
  });

  it('should autocomplete or show a list based on the set name', () => {
    formH.setValue('name', component.nameAttributes[0]);
    expect(component.possibleValues).toEqual(['alert0', 'alert1']);
    formH.setValue('name', component.nameAttributes[1]);
    expect(component.possibleValues).toEqual(['someInstance']);
    formH.setValue('name', component.nameAttributes[2]);
    expect(component.possibleValues).toEqual(['someJob']);
    formH.setValue('name', component.nameAttributes[3]);
    expect(component.possibleValues).toEqual(['someSeverity']);
  });

  describe('test rule matching', () => {
    const expectMatch = (name, value, helpText, successClass: boolean) => {
      component.preFillControls({
        name: name,
        value: value,
        isRegex: false
      });
      const helpBlock = fixtureH.getElementByCss('#match-state');
      expect(helpBlock.nativeElement.textContent).toContain(helpText);
      expect(helpBlock.properties['className']).toContain(
        successClass ? 'has-success' : 'has-warning'
      );
    };

    it('should match no rule and no alert', () => {
      expectMatch(
        'alertname',
        'alert',
        'Your matcher seems to match no currently defined rule or active alert.',
        false
      );
    });

    it('should match a rule with no alert', () => {
      expectMatch('alertname', 'alert1', 'Matches 1 rule with no active alerts.', false);
    });

    it('should match a rule and an alert', () => {
      expectMatch('alertname', 'alert0', 'Matches 1 rule with 1 active alert.', true);
    });

    it('should match multiple rules and an alert', () => {
      expectMatch('severity', 'someSeverity', 'Matches 2 rules with 1 active alert.', true);
    });

    it('should match multiple rules and multiple alerts', () => {
      component.rules[1].alerts.push(null);
      expectMatch('severity', 'someSeverity', 'Matches 2 rules with 2 active alerts.', true);
    });

    it('should not show match-state if regex is checked', () => {
      fixtureH.expectElementVisible('#match-state', false);
      formH.setValue('name', 'severity');
      formH.setValue('value', 'someSeverity');
      fixtureH.expectElementVisible('#match-state', true);
      formH.setValue('isRegex', true);
      fixtureH.expectElementVisible('#match-state', false);
    });
  });

  it('should value field should only be enabled if name was set', () => {
    const value = component.form.get('value');
    expect(value.disabled).toBeTruthy();
    formH.setValue('name', component.nameAttributes[0]);
    expect(value.enabled).toBeTruthy();
    formH.setValue('name', null);
    expect(value.disabled).toBeTruthy();
  });

  it('should have a value field', () => {
    formH.setValue('name', component.nameAttributes[0]);
    formH.expectError('value', 'required');
    formH.expectValidChange('value', 'alert0');
  });

  it('should test preFillControls', () => {
    const controlValues = {
      name: 'alertname',
      value: 'alert0',
      isRegex: false
    };
    component.preFillControls(controlValues);
    expect(component.form.value).toEqual(controlValues);
  });

  it('should test submit', (done) => {
    const controlValues = {
      name: 'alertname',
      value: 'alert0',
      isRegex: false
    };
    component.preFillControls(controlValues);
    component.submitAction.subscribe((resp) => {
      expect(resp).toEqual(controlValues);
      done();
    });
    component.onSubmit();
  });
});
