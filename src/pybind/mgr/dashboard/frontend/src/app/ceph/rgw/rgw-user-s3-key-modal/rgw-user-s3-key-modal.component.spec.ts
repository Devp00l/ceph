import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { RouterTestingModule } from '@angular/router/testing';
import { configureTestBed, i18nProviders } from '../../../../testing/unit-test-helper';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { SharedModule } from '../../../shared/shared.module';
import { RgwUserS3KeyModalComponent } from './rgw-user-s3-key-modal.component';

describe('RgwUserS3KeyModalComponent', () => {
  let component: RgwUserS3KeyModalComponent;
  let fixture: ComponentFixture<RgwUserS3KeyModalComponent>;

  configureTestBed({
    declarations: [RgwUserS3KeyModalComponent],
    imports: [ReactiveFormsModule, SharedModule, RouterTestingModule],
    providers: [BsModalRef, i18nProviders]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RgwUserS3KeyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
