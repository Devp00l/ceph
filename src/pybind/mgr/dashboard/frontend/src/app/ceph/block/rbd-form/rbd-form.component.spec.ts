import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { ToastModule } from 'ng2-toastr';

import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ActivatedRouteStub } from '../../../../testing/activated-route-stub';
import { configureTestBed, i18nProviders } from '../../../../testing/unit-test-helper';
import { RbdService } from '../../../shared/api/rbd.service';
import { SharedModule } from '../../../shared/shared.module';
import { RbdConfigurationFormComponent } from '../rbd-configuration-form/rbd-configuration-form.component';
import { RbdFormMode } from './rbd-form-mode.enum';
import { RbdFormComponent } from './rbd-form.component';

describe('RbdFormComponent', () => {
  let component: RbdFormComponent;
  let fixture: ComponentFixture<RbdFormComponent>;
  let activatedRoute: ActivatedRouteStub;

  const queryNativeElement = (cssSelector) =>
    fixture.debugElement.query(By.css(cssSelector)).nativeElement;

  configureTestBed({
    imports: [
      HttpClientTestingModule,
      ReactiveFormsModule,
      RouterTestingModule,
      ToastModule.forRoot(),
      SharedModule,
      TooltipModule
    ],
    declarations: [RbdFormComponent, RbdConfigurationFormComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: new ActivatedRouteStub({ pool: 'foo', name: 'bar', snap: undefined })
      },
      i18nProviders,
      RbdService
    ]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RbdFormComponent);
    component = fixture.componentInstance;
    activatedRoute = TestBed.get(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('should test decodeURIComponent of params', () => {
    let rbdService: RbdService;

    beforeEach(() => {
      rbdService = TestBed.get(RbdService);
      component.mode = RbdFormMode.editing;
      fixture.detectChanges();
      spyOn(rbdService, 'get').and.callThrough();
    });

    it('without snapName', () => {
      activatedRoute.setParams({ pool: 'foo%2Ffoo', name: 'bar%2Fbar', snap: undefined });

      expect(rbdService.get).toHaveBeenCalledWith('foo/foo', 'bar/bar');
      expect(component.snapName).toBeUndefined();
    });

    it('with snapName', () => {
      activatedRoute.setParams({ pool: 'foo%2Ffoo', name: 'bar%2Fbar', snap: 'baz%2Fbaz' });

      expect(rbdService.get).toHaveBeenCalledWith('foo/foo', 'bar/bar');
      expect(component.snapName).toBe('baz/baz');
    });
  });

  describe('test image configuration component', () => {
    it('is visible', () => {
      fixture.detectChanges();
      expect(queryNativeElement('cd-rbd-configuration-form').parentElement.hidden).toBe(false);
    });
  });

  describe('tests for feature flags', () => {
    let deepFlatten, layering, exclusiveLock, objectMap, journaling, fastDiff;

    const setFeatures = (features) => {
      component.features = features;
      component.featuresList = component.objToArray(features);
      component.createForm();
    };

    const resetFeatures = (
      defaultFeatures = ['deep-flatten', 'exclusive-lock', 'fast-diff', 'layering', 'object-map']
    ) => {
      const rbdService = TestBed.get(RbdService);
      spyOn(rbdService, 'defaultFeatures').and.returnValue(of(defaultFeatures));
      component.router = { url: '/block/rbd/create' } as Router;
      component.ngOnInit();
      tick();
      fixture.detectChanges();
    };

    beforeEach(fakeAsync(() => {
      resetFeatures();
      [deepFlatten, layering, exclusiveLock, objectMap, journaling, fastDiff] = [
        'deep-flatten',
        'layering',
        'exclusive-lock',
        'object-map',
        'journaling',
        'fast-diff'
      ].map((f) => queryNativeElement(`#${f}`));
    }));

    it('should convert feature flags correctly in the constructor', () => {
      setFeatures({
        one: { desc: 'one', allowEnable: true, allowDisable: true },
        two: { desc: 'two', allowEnable: true, allowDisable: true },
        three: { desc: 'three', allowEnable: true, allowDisable: true }
      });
      expect(component.featuresList).toEqual([
        { desc: 'one', key: 'one', allowDisable: true, allowEnable: true },
        { desc: 'two', key: 'two', allowDisable: true, allowEnable: true },
        { desc: 'three', key: 'three', allowDisable: true, allowEnable: true }
      ]);
    });

    it('should initialize the checkboxes correctly', fakeAsync(() => {
      expect(deepFlatten.disabled).toBe(false);
      expect(layering.disabled).toBe(false);
      expect(exclusiveLock.disabled).toBe(false);
      expect(objectMap.disabled).toBe(false);
      expect(journaling.disabled).toBe(false);
      expect(fastDiff.disabled).toBe(false);

      expect(deepFlatten.checked).toBe(true);
      expect(layering.checked).toBe(true);
      expect(exclusiveLock.checked).toBe(true);
      expect(objectMap.checked).toBe(true);
      expect(journaling.checked).toBe(false);
      expect(fastDiff.checked).toBe(true);
    }));

    it('should disable features if their requirements are not met (exclusive-lock)', fakeAsync(() => {
      exclusiveLock.click(); // unchecks exclusive-lock
      tick();
      expect(objectMap.disabled).toBe(true);
      expect(journaling.disabled).toBe(true);
      expect(fastDiff.disabled).toBe(true);
    }));

    it('should disable features if their requirements are not met (object-map)', fakeAsync(() => {
      objectMap.click(); // unchecks object-map
      tick();
      expect(fastDiff.disabled).toBe(true);
    }));
  });
});
