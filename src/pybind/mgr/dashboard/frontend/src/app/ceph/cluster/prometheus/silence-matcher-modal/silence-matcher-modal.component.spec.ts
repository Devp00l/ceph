import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BsModalRef } from 'ngx-bootstrap/modal';

import {
  configureTestBed,
  FixtureHelper,
  FormHelper,
  i18nProviders,
  PrometheusHelper
} from '../../../../../testing/unit-test-helper';
import { SharedModule } from '../../../../shared/shared.module';
import { ClusterModule } from '../../cluster.module';
import { SilenceMatcherModalComponent } from './silence-matcher-modal.component';

describe('SilenceMatcherModalComponent', () => {
  let component: SilenceMatcherModalComponent;
  let fixture: ComponentFixture<SilenceMatcherModalComponent>;
  let formH: FormHelper;
  let fixtureH: FixtureHelper;
  let prometheus: PrometheusHelper;

  configureTestBed({
    imports: [HttpClientTestingModule, SharedModule, ClusterModule],
    providers: [BsModalRef, i18nProviders]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SilenceMatcherModalComponent);
    fixtureH = new FixtureHelper(fixture);
    component = fixture.componentInstance;
    formH = new FormHelper(component.form);

    prometheus = new PrometheusHelper();
    const alert = prometheus.createAlert('alert0');
    component.alerts = [alert];
    component.rules = [
      prometheus.createRule('alert0', 'someSeverity', [alert]),
      prometheus.createRule('alert1', 'someOtherSeverity', [])
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a name field', () => {
    formH.expectError('name', 'required');
    formH.expectValidChange('name', 'CPU 50% above usual load');
  });

  it('should autocomplete or show a list based on the set name', () => {
    formH.setValue('name', component.nameAttributes[0]);
    expect(component.possibleValues).toEqual(['alert0', 'alert1']);
    formH.setValue('name', component.nameAttributes[1]);
    expect(component.possibleValues).toEqual(['someInstance']);
    formH.setValue('name', component.nameAttributes[2]);
    expect(component.possibleValues).toEqual(['someJob']);
    formH.setValue('name', component.nameAttributes[3]);
    expect(component.possibleValues).toEqual(['someSeverity', 'someOtherSeverity']);
  });

  it('shows how many rules and alerts would be affected', () => {
    formH.setValue('name', component.nameAttributes[0]);
    formH.setValue('value', 'alert0');
    // expect something
  });

  it('should value field should only be enabled if name was set', () => {
    const value = component.form.get('value');
    expect(value.disabled).toBeTruthy()
    formH.setValue('name', component.nameAttributes[0]);
    expect(value.enabled).toBeTruthy()
    formH.setValue('name', null);
    expect(value.disabled).toBeTruthy()
  });

  it('should have a value field', () => {
    formH.setValue('name', component.nameAttributes[0]);
    formH.expectError('value', 'required');
    formH.expectValidChange('value', 'alert0');
  });

  describe('verifying', () => {
    it('should that the matcher combination matches something', () => {});
    it('should warn if it only matches something that is not active', () => {});
    it('should warn if it only matches active and non active alerts', () => {});
    it('should show matched alerts', () => {});
  });
});
