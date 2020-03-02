import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NgBootstrapFormValidationModule } from 'ng-bootstrap-form-validation';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';

import {
  configureTestBed,
  FixtureHelper,
  FormHelper,
  i18nProviders
} from '../../../../testing/unit-test-helper';
import { NotFoundComponent } from '../../../core/not-found/not-found.component';
import { ErasureCodeProfileService } from '../../../shared/api/erasure-code-profile.service';
import { PoolService } from '../../../shared/api/pool.service';
import { CriticalConfirmationModalComponent } from '../../../shared/components/critical-confirmation-modal/critical-confirmation-modal.component';
import { SelectBadgesComponent } from '../../../shared/components/select-badges/select-badges.component';
import { CdFormGroup } from '../../../shared/forms/cd-form-group';
import { CrushRule } from '../../../shared/models/crush-rule';
import { ErasureCodeProfile } from '../../../shared/models/erasure-code-profile';
import { Permission } from '../../../shared/models/permissions';
import { PoolFormInfo } from '../../../shared/models/pool-form-info';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';
import { TaskWrapperService } from '../../../shared/services/task-wrapper.service';
import { Pool } from '../pool';
import { PoolModule } from '../pool.module';
import { PoolFormComponent } from './pool-form.component';

describe('PoolFormComponent', () => {
  const OSDS = 8;
  let formHelper: FormHelper;
  let fixtureHelper: FixtureHelper;
  let component: PoolFormComponent;
  let fixture: ComponentFixture<PoolFormComponent>;
  let poolService: PoolService;
  let form: CdFormGroup;
  let router: Router;
  let ecpService: ErasureCodeProfileService;

  const setPgNum = (pgs: number): AbstractControl => {
    const control = formHelper.setValue('pgNum', pgs);
    fixture.debugElement.query(By.css('#pgNum')).nativeElement.dispatchEvent(new Event('blur'));
    return control;
  };

  const testPgUpdate = (pgs: number, jump: number, returnValue: number) => {
    if (pgs) {
      setPgNum(pgs);
    }
    if (jump) {
      setPgNum(form.getValue('pgNum') + jump);
    }
    expect(form.getValue('pgNum')).toBe(returnValue);
  };

  const createCrushRule = ({
    id = 0,
    name = 'somePoolName',
    min = 1,
    max = 10,
    type = 'replicated'
  }: {
    max?: number;
    min?: number;
    id?: number;
    name?: string;
    type?: string;
  }) => {
    const typeNumber = type === 'erasure' ? 3 : 1;
    const rule = new CrushRule();
    rule.max_size = max;
    rule.min_size = min;
    rule.rule_id = id;
    rule.ruleset = typeNumber;
    rule.rule_name = name;
    rule.steps = [
      {
        item_name: 'default',
        item: -1,
        op: 'take'
      },
      {
        num: 0,
        type: 'osd',
        op: 'choose_firstn'
      },
      {
        op: 'emit'
      }
    ];
    return rule;
  };

  const expectValidSubmit = (
    pool: any,
    taskName = 'pool/create',
    poolServiceMethod: 'create' | 'update' = 'create'
  ) => {
    spyOn(poolService, poolServiceMethod).and.stub();
    const taskWrapper = TestBed.get(TaskWrapperService);
    spyOn(taskWrapper, 'wrapTaskAroundCall').and.callThrough();
    component.submit();
    expect(poolService[poolServiceMethod]).toHaveBeenCalledWith(pool);
    expect(taskWrapper.wrapTaskAroundCall).toHaveBeenCalledWith({
      task: {
        name: taskName,
        metadata: {
          pool_name: pool.pool
        }
      },
      call: undefined // because of stub
    });
  };

  let infoReturn: PoolFormInfo;
  const setInfo = () => {
    const ecp1 = new ErasureCodeProfile();
    ecp1.name = 'ecp1';
    infoReturn = {
      pool_names: ['someExistingPoolName'],
      osd_count: OSDS,
      is_all_bluestore: true,
      bluestore_compression_algorithm: 'snappy',
      compression_algorithms: ['snappy'],
      compression_modes: ['none', 'passive'],
      crush_rules_replicated: [
        createCrushRule({ id: 0, min: 2, max: 4, name: 'rep1', type: 'replicated' }),
        createCrushRule({ id: 1, min: 3, max: 18, name: 'rep2', type: 'replicated' })
      ],
      crush_rules_erasure: [
        createCrushRule({ id: 3, min: 1, max: 1, name: 'ecp1', type: 'erasure' })
      ],
      erasure_code_profiles: [ecp1],
      pg_autoscale_config: { default: 'off', enum_values: ['on', 'warn', 'off'], value: [] },
      used_rules: {}
    };
  };

  const setUpPoolComponent = () => {
    fixture = TestBed.createComponent(PoolFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    fixtureHelper = new FixtureHelper(fixture);
    form = component.form;
    formHelper = new FormHelper(form);
  };

  const routes: Routes = [{ path: '404', component: NotFoundComponent }];

  configureTestBed({
    declarations: [NotFoundComponent],
    imports: [
      HttpClientTestingModule,
      RouterTestingModule.withRoutes(routes),
      ToastrModule.forRoot(),
      TabsModule.forRoot(),
      PoolModule,
      NgBootstrapFormValidationModule.forRoot()
    ],
    providers: [
      ErasureCodeProfileService,
      SelectBadgesComponent,
      { provide: ActivatedRoute, useValue: { params: of({ name: 'somePoolName' }) } },
      i18nProviders
    ]
  });

  beforeEach(() => {
    poolService = TestBed.get(PoolService);
    setInfo();
    spyOn(poolService, 'getInfo').and.callFake(() => of(infoReturn));

    ecpService = TestBed.get(ErasureCodeProfileService);

    router = TestBed.get(Router);

    setUpPoolComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('redirect not allowed users', () => {
    let poolPermissions: Permission;
    let authStorageService: AuthStorageService;

    const testForRedirect = (times: number) => {
      component.authenticate();
      expect(router.navigate).toHaveBeenCalledTimes(times);
    };

    beforeEach(() => {
      poolPermissions = {
        create: false,
        update: false,
        read: false,
        delete: false
      };
      authStorageService = TestBed.get(AuthStorageService);
      spyOn(authStorageService, 'getPermissions').and.callFake(() => ({
        pool: poolPermissions
      }));
    });

    it('navigates to 404 if not allowed', () => {
      component.authenticate();
      expect(router.navigate).toHaveBeenCalledWith(['/404']);
    });

    it('navigates if user is not allowed', () => {
      testForRedirect(1);
      poolPermissions.read = true;
      testForRedirect(2);
      poolPermissions.delete = true;
      testForRedirect(3);
      poolPermissions.update = true;
      testForRedirect(4);
      component.editing = true;
      poolPermissions.update = false;
      poolPermissions.create = true;
      testForRedirect(5);
    });

    it('does not navigate users with right permissions', () => {
      poolPermissions.read = true;
      poolPermissions.create = true;
      testForRedirect(0);
      component.editing = true;
      poolPermissions.update = true;
      testForRedirect(0);
      poolPermissions.create = false;
      testForRedirect(0);
    });
  });

  describe('pool form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('is invalid at the beginning all sub forms are valid with multiple crush Rules', () => {
      expect(form.valid).toBeFalsy();
      ['name', 'poolType', 'crushRule', 'pgNum'].forEach((name) =>
        formHelper.expectError(name, 'required')
      );
      ['size', 'erasureProfile', 'ecOverwrites'].forEach((name) => formHelper.expectValid(name));
      expect(component.form.get('compression').valid).toBeTruthy();
    });

    it('is invalid at the beginning all sub forms are valid without crush Rules', () => {
      infoReturn.crush_rules_replicated = [];
      setUpPoolComponent();
      expect(form.valid).toBeFalsy();
      ['name', 'poolType', 'pgNum'].forEach((name) => formHelper.expectError(name, 'required'));
      ['crushRule', 'size', 'erasureProfile', 'ecOverwrites'].forEach((name) =>
        formHelper.expectValid(name)
      );
      expect(component.form.get('compression').valid).toBeTruthy();
    });

    it('validates name', () => {
      expect(component.editing).toBeFalsy();
      formHelper.expectError('name', 'required');
      formHelper.expectValidChange('name', 'some-name');
      formHelper.expectValidChange('name', 'name/with/slash');
      formHelper.expectErrorChange('name', 'someExistingPoolName', 'uniqueName');
      formHelper.expectErrorChange('name', 'wrong format with spaces', 'pattern');
    });

    it('should validate with dots in pool name', () => {
      formHelper.expectValidChange('name', 'pool.default.bar', true);
    });

    it('validates poolType', () => {
      formHelper.expectError('poolType', 'required');
      formHelper.expectValidChange('poolType', 'erasure');
      formHelper.expectValidChange('poolType', 'replicated');
    });

    it('validates that pgNum is required creation mode', () => {
      formHelper.expectError(form.get('pgNum'), 'required');
    });

    it('validates pgNum in edit mode', () => {
      component.data.pool = new Pool('test');
      component.data.pool.pg_num = 16;
      component.editing = true;
      component.ngOnInit(); // Switches form into edit mode
      formHelper.setValue('poolType', 'erasure');
      fixture.detectChanges();
      formHelper.expectValid(setPgNum(8));
    });

    it('is valid if pgNum, poolType and name are valid', () => {
      formHelper.setValue('name', 'some-name');
      formHelper.setValue('poolType', 'erasure');
      fixture.detectChanges();
      setPgNum(1);
      expect(form.valid).toBeTruthy();
    });

    it('validates crushRule with multiple crush rules', () => {
      formHelper.expectError('crushRule', 'required'); // As multiple rules exist
      formHelper.expectErrorChange('crushRule', { min_size: 20 }, 'tooFewOsds');
    });

    it('validates crushRule with no crush rules', () => {
      infoReturn.crush_rules_replicated = [];
      setUpPoolComponent();
      formHelper.expectValid('crushRule');
      formHelper.expectErrorChange('crushRule', { min_size: 20 }, 'tooFewOsds');
    });

    it('validates size', () => {
      formHelper.setValue('poolType', 'replicated');
      formHelper.expectValid('size');
      formHelper.setValue('crushRule', {
        min_size: 2,
        max_size: 6
      });
      formHelper.expectErrorChange('size', 1, 'min');
      formHelper.expectErrorChange('size', 8, 'max');
      formHelper.expectValidChange('size', 6);
    });

    it('validates compression mode default value', () => {
      expect(form.getValue('mode')).toBe('none');
    });

    it('validate quotas', () => {
      formHelper.expectValid('max_bytes');
      formHelper.expectValid('max_objects');
      formHelper.expectValidChange('max_bytes', '10 Gib');
      formHelper.expectValidChange('max_bytes', '');
      formHelper.expectValidChange('max_objects', '');
      formHelper.expectErrorChange('max_objects', -1, 'min');
    });

    describe('compression form', () => {
      beforeEach(() => {
        formHelper.setValue('poolType', 'replicated');
        formHelper.setValue('mode', 'passive');
      });

      it('is valid', () => {
        expect(component.form.get('compression').valid).toBeTruthy();
      });

      it('validates minBlobSize to be only valid between 0 and maxBlobSize', () => {
        formHelper.expectErrorChange('minBlobSize', -1, 'min');
        formHelper.expectValidChange('minBlobSize', 0);
        formHelper.setValue('maxBlobSize', '2 KiB');
        formHelper.expectErrorChange('minBlobSize', '3 KiB', 'maximum');
        formHelper.expectValidChange('minBlobSize', '1.9 KiB');
      });

      it('validates minBlobSize converts numbers', () => {
        const control = formHelper.setValue('minBlobSize', '1');
        fixture.detectChanges();
        formHelper.expectValid(control);
        expect(control.value).toBe('1 KiB');
      });

      it('validates maxBlobSize to be only valid bigger than minBlobSize', () => {
        formHelper.expectErrorChange('maxBlobSize', -1, 'min');
        formHelper.setValue('minBlobSize', '1 KiB');
        formHelper.expectErrorChange('maxBlobSize', '0.5 KiB', 'minimum');
        formHelper.expectValidChange('maxBlobSize', '1.5 KiB');
      });

      it('s valid to only use one blob size', () => {
        formHelper.expectValid(formHelper.setValue('minBlobSize', '1 KiB'));
        formHelper.expectValid(formHelper.setValue('maxBlobSize', ''));
        formHelper.expectValid(formHelper.setValue('minBlobSize', ''));
        formHelper.expectValid(formHelper.setValue('maxBlobSize', '1 KiB'));
      });

      it('dismisses any size error if one of the blob sizes is changed into a valid state', () => {
        const min = formHelper.setValue('minBlobSize', '10 KiB');
        const max = formHelper.setValue('maxBlobSize', '1 KiB');
        fixture.detectChanges();
        max.setValue('');
        formHelper.expectValid(min);
        formHelper.expectValid(max);
        max.setValue('1 KiB');
        fixture.detectChanges();
        min.setValue('0.5 KiB');
        formHelper.expectValid(min);
        formHelper.expectValid(max);
      });

      it('validates maxBlobSize converts numbers', () => {
        const control = formHelper.setValue('maxBlobSize', '2');
        fixture.detectChanges();
        expect(control.value).toBe('2 KiB');
      });

      it('validates that odd size validator works as expected', () => {
        const odd = (min: string, max: string) => component['oddBlobSize'](min, max);
        expect(odd('10', '8')).toBe(true);
        expect(odd('8', '-')).toBe(false);
        expect(odd('8', '10')).toBe(false);
        expect(odd(null, '8')).toBe(false);
        expect(odd('10', '')).toBe(false);
        expect(odd('10', null)).toBe(false);
        expect(odd(null, null)).toBe(false);
      });

      it('validates ratio to be only valid between 0 and 1', () => {
        formHelper.expectValid('ratio');
        formHelper.expectErrorChange('ratio', -0.1, 'min');
        formHelper.expectValidChange('ratio', 0);
        formHelper.expectValidChange('ratio', 1);
        formHelper.expectErrorChange('ratio', 1.1, 'max');
      });
    });

    it('validates application metadata name', () => {
      formHelper.setValue('poolType', 'replicated');
      fixture.detectChanges();
      const selectBadges = fixture.debugElement.query(By.directive(SelectBadgesComponent))
        .componentInstance;
      const control = selectBadges.cdSelect.filter;
      formHelper.expectValid(control);
      control.setValue('?');
      formHelper.expectError(control, 'pattern');
      control.setValue('Ab3_');
      formHelper.expectValid(control);
      control.setValue('a'.repeat(129));
      formHelper.expectError(control, 'maxlength');
    });
  });

  describe('pool type changes', () => {
    beforeEach(() => {
      component.ngOnInit();
      createCrushRule({ id: 3, min: 1, max: 1, name: 'ep1', type: 'erasure' });
      createCrushRule({ id: 0, min: 2, max: 4, name: 'rep1', type: 'replicated' });
      createCrushRule({ id: 1, min: 3, max: 18, name: 'rep2', type: 'replicated' });
    });

    it('should have a default replicated size of 3', () => {
      formHelper.setValue('poolType', 'replicated');
      expect(form.getValue('size')).toBe(3);
    });

    describe('replicatedRuleChange', () => {
      beforeEach(() => {
        formHelper.setValue('poolType', 'replicated');
        formHelper.setValue('size', 99);
      });

      it('should not set size if a replicated pool is not set', () => {
        formHelper.setValue('poolType', 'erasure');
        expect(form.getValue('size')).toBe(99);
        formHelper.setValue('crushRule', component.info.crush_rules_replicated[1]);
        expect(form.getValue('size')).toBe(99);
      });

      it('should set size to maximum if size exceeds maximum', () => {
        formHelper.setValue('crushRule', component.info.crush_rules_replicated[0]);
        expect(form.getValue('size')).toBe(4);
      });

      it('should set size to minimum if size is lower than minimum', () => {
        formHelper.setValue('size', -1);
        formHelper.setValue('crushRule', component.info.crush_rules_replicated[0]);
        expect(form.getValue('size')).toBe(2);
      });
    });

    describe('rulesChange', () => {
      it('has no effect if info is not there', () => {
        delete component.info;
        formHelper.setValue('poolType', 'replicated');
        expect(component.current.rules).toEqual([]);
      });

      it('has no effect if pool type is not set', () => {
        component['rulesChange']('');
        expect(component.current.rules).toEqual([]);
      });

      it('shows all replicated rules when pool type is "replicated"', () => {
        formHelper.setValue('poolType', 'replicated');
        expect(component.current.rules).toEqual(component.info.crush_rules_replicated);
        expect(component.current.rules.length).toBe(2);
      });

      it('shows all erasure code rules when pool type is "erasure"', () => {
        formHelper.setValue('poolType', 'erasure');
        expect(component.current.rules).toEqual(component.info.crush_rules_erasure);
        expect(component.current.rules.length).toBe(1);
      });

      it('disables rule field if only one rule exists which is used in the disabled field', () => {
        formHelper.setValue('poolType', 'erasure');
        const control = form.get('crushRule');
        expect(control.value).toEqual(component.info.crush_rules_erasure[0]);
        expect(control.disabled).toBe(true);
      });

      it('does not select the first rule if more than one exist', () => {
        formHelper.setValue('poolType', 'replicated');
        const control = form.get('crushRule');
        expect(control.value).toEqual(null);
        expect(control.disabled).toBe(false);
      });

      it('changing between both types will not leave crushRule in a bad state', () => {
        formHelper.setValue('poolType', 'erasure');
        formHelper.setValue('poolType', 'replicated');
        const control = form.get('crushRule');
        expect(control.value).toEqual(null);
        expect(control.disabled).toBe(false);
        formHelper.setValue('poolType', 'erasure');
        expect(control.value).toEqual(component.info.crush_rules_erasure[0]);
        expect(control.disabled).toBe(true);
      });
    });
  });

  describe('getMaxSize and getMinSize', () => {
    const setCrushRule = ({ min, max }: { min?: number; max?: number }) => {
      formHelper.setValue('crushRule', {
        min_size: min,
        max_size: max
      });
    };

    it('returns 0 if osd count is 0', () => {
      component.info.osd_count = 0;
      expect(component.getMinSize()).toBe(0);
      expect(component.getMaxSize()).toBe(0);
    });

    it('returns 0 if info is not there', () => {
      delete component.info;
      expect(component.getMinSize()).toBe(0);
      expect(component.getMaxSize()).toBe(0);
    });

    it('returns minimum and maximum of rule', () => {
      setCrushRule({ min: 2, max: 6 });
      expect(component.getMinSize()).toBe(2);
      expect(component.getMaxSize()).toBe(6);
    });

    it('returns 1 as minimum and the osd count as maximum if no crush rule is available', () => {
      expect(component.getMinSize()).toBe(1);
      expect(component.getMaxSize()).toBe(OSDS);
    });

    it('returns the osd count as maximum if the rule maximum exceeds it', () => {
      setCrushRule({ max: 100 });
      expect(component.getMaxSize()).toBe(OSDS);
    });

    it('should return the osd count as minimum if its lower the the rule minimum', () => {
      setCrushRule({ min: 10 });
      expect(component.getMinSize()).toBe(10);
      const control = form.get('crushRule');
      expect(control.invalid).toBe(true);
      formHelper.expectError(control, 'tooFewOsds');
    });
  });

  describe('application metadata', () => {
    let selectBadges: SelectBadgesComponent;

    const testAddApp = (app?: string, result?: string[]) => {
      selectBadges.cdSelect.filter.setValue(app);
      selectBadges.cdSelect.updateFilter();
      selectBadges.cdSelect.selectOption();
      expect(component.data.applications.selected).toEqual(result);
    };

    const testRemoveApp = (app: string, result: string[]) => {
      selectBadges.cdSelect.removeItem(app);
      expect(component.data.applications.selected).toEqual(result);
    };

    const setCurrentApps = (apps: string[]) => {
      component.data.applications.selected = apps;
      fixture.detectChanges();
      selectBadges.cdSelect.ngOnInit();
      return apps;
    };

    beforeEach(() => {
      formHelper.setValue('poolType', 'replicated');
      fixture.detectChanges();
      selectBadges = fixture.debugElement.query(By.directive(SelectBadgesComponent))
        .componentInstance;
    });

    it('adds all predefined and a custom applications to the application metadata array', () => {
      testAddApp('g', ['rgw']);
      testAddApp('b', ['rbd', 'rgw']);
      testAddApp('c', ['cephfs', 'rbd', 'rgw']);
      testAddApp('ownApp', ['cephfs', 'ownApp', 'rbd', 'rgw']);
    });

    it('only allows 4 apps to be added to the array', () => {
      const apps = setCurrentApps(['d', 'c', 'b', 'a']);
      testAddApp('e', apps);
    });

    it('can remove apps', () => {
      setCurrentApps(['a', 'b', 'c', 'd']);
      testRemoveApp('c', ['a', 'b', 'd']);
      testRemoveApp('a', ['b', 'd']);
      testRemoveApp('d', ['b']);
      testRemoveApp('b', []);
    });

    it('does not remove any app that is not in the array', () => {
      const apps = ['a', 'b', 'c', 'd'];
      setCurrentApps(apps);
      testRemoveApp('e', apps);
      testRemoveApp('0', apps);
    });
  });

  describe('pg number changes', () => {
    beforeEach(() => {
      formHelper.setValue('crushRule', {
        min_size: 1,
        max_size: 20
      });
      formHelper.setValue('poolType', 'erasure');
      fixture.detectChanges();
      setPgNum(256);
    });

    it('updates by value', () => {
      testPgUpdate(10, undefined, 8);
      testPgUpdate(22, undefined, 16);
      testPgUpdate(26, undefined, 32);
      testPgUpdate(200, undefined, 256);
      testPgUpdate(300, undefined, 256);
      testPgUpdate(350, undefined, 256);
    });

    it('updates by jump -> a magnitude of the power of 2', () => {
      testPgUpdate(undefined, 1, 512);
      testPgUpdate(undefined, -1, 256);
    });

    it('returns 1 as minimum for false numbers', () => {
      testPgUpdate(-26, undefined, 1);
      testPgUpdate(0, undefined, 1);
      testPgUpdate(0, -1, 1);
      testPgUpdate(undefined, -20, 1);
    });

    it('changes the value and than jumps', () => {
      testPgUpdate(230, 1, 512);
      testPgUpdate(3500, -1, 2048);
    });

    describe('pg power jump', () => {
      it('should jump correctly at the beginning', () => {
        testPgUpdate(1, -1, 1);
        testPgUpdate(1, 1, 2);
        testPgUpdate(2, -1, 1);
        testPgUpdate(2, 1, 4);
        testPgUpdate(4, -1, 2);
        testPgUpdate(4, 1, 8);
        testPgUpdate(4, 1, 8);
      });

      it('increments pg power if difference to the current number is 1', () => {
        testPgUpdate(undefined, 1, 512);
        testPgUpdate(undefined, 1, 1024);
        testPgUpdate(undefined, 1, 2048);
        testPgUpdate(undefined, 1, 4096);
      });

      it('decrements pg power if difference to the current number is -1', () => {
        testPgUpdate(undefined, -1, 128);
        testPgUpdate(undefined, -1, 64);
        testPgUpdate(undefined, -1, 32);
        testPgUpdate(undefined, -1, 16);
        testPgUpdate(undefined, -1, 8);
      });
    });

    describe('pgCalc', () => {
      const PGS = 1;

      const getValidCase = () => ({
        type: 'replicated',
        osds: OSDS,
        size: 4,
        ecp: {
          k: 2,
          m: 2
        },
        expected: 256
      });

      const testPgCalc = ({ type, osds, size, ecp, expected }: Record<string, any>) => {
        component.info.osd_count = osds;
        formHelper.setValue('poolType', type);
        if (type === 'replicated') {
          formHelper.setValue('size', size);
        } else {
          formHelper.setValue('erasureProfile', ecp);
        }
        expect(form.getValue('pgNum')).toBe(expected);
        expect(component.externalPgChange).toBe(PGS !== expected);
      };

      beforeEach(() => {
        setPgNum(PGS);
      });

      it('does not change anything if type is not valid', () => {
        const test = getValidCase();
        test.type = '';
        test.expected = PGS;
        testPgCalc(test);
      });

      it('does not change anything if ecp is not valid', () => {
        const test = getValidCase();
        test.expected = PGS;
        test.type = 'erasure';
        test.ecp = null;
        testPgCalc(test);
      });

      it('calculates some replicated values', () => {
        const test = getValidCase();
        testPgCalc(test);
        test.osds = 16;
        test.expected = 512;
        testPgCalc(test);
        test.osds = 8;
        test.size = 8;
        test.expected = 128;
        testPgCalc(test);
      });

      it('calculates erasure code values even if selection is disabled', () => {
        component['initEcp']([{ k: 2, m: 2, name: 'bla', plugin: '', technique: '' }]);
        const test = getValidCase();
        test.type = 'erasure';
        testPgCalc(test);
        expect(form.get('erasureProfile').disabled).toBeTruthy();
      });

      it('calculates some erasure code values', () => {
        const test = getValidCase();
        test.type = 'erasure';
        testPgCalc(test);
        test.osds = 16;
        test.ecp.m = 5;
        test.expected = 256;
        testPgCalc(test);
        test.ecp.k = 5;
        test.expected = 128;
        testPgCalc(test);
      });

      it('should not change a manual set pg number', () => {
        form.get('pgNum').markAsDirty();
        const test = getValidCase();
        test.expected = PGS;
        testPgCalc(test);
      });
    });
  });

  describe('crushRule', () => {
    const selectRuleById = (n: number) => {
      formHelper.setValue('crushRule', component.info.crush_rules_replicated[n]);
    };

    beforeEach(() => {
      formHelper.setValue('poolType', 'replicated');
      selectRuleById(0);
      fixture.detectChanges();
    });

    it('should not show info per default', () => {
      fixtureHelper.expectElementVisible('#crushRule', true);
      fixtureHelper.expectElementVisible('#crush-info-block', false);
    });

    it('should show info if the info button is clicked', () => {
      const infoButton = fixture.debugElement.query(By.css('#crush-info-button'));
      infoButton.triggerEventHandler('click', null);
      expect(component.data.crushInfo).toBeTruthy();
      fixture.detectChanges();
      expect(infoButton.classes['active']).toBeTruthy();
      fixtureHelper.expectIdElementsVisible(['crushRule', 'crush-info-block'], true);
    });
  });

  describe('erasure code profile', () => {
    const setSelectedEcp = (name: string) => {
      formHelper.setValue('erasureProfile', { name: name });
    };

    beforeEach(() => {
      formHelper.setValue('poolType', 'erasure');
      fixture.detectChanges();
    });

    it('should not show info per default', () => {
      fixtureHelper.expectElementVisible('#erasureProfile', true);
      fixtureHelper.expectElementVisible('#ecp-info-block', false);
    });

    it('should show info if the info button is clicked', () => {
      const infoButton = fixture.debugElement.query(By.css('#ecp-info-button'));
      infoButton.triggerEventHandler('click', null);
      expect(component.data.erasureInfo).toBeTruthy();
      fixture.detectChanges();
      expect(infoButton.classes['active']).toBeTruthy();
      fixtureHelper.expectIdElementsVisible(['erasureProfile', 'ecp-info-block'], true);
    });

    describe('ecp deletion', () => {
      let taskWrapper: TaskWrapperService;
      let deletion: CriticalConfirmationModalComponent;

      const callDeletion = () => {
        component.deleteErasureCodeProfile();
        deletion.submitActionObservable();
      };

      const testPoolDeletion = (name: string) => {
        setSelectedEcp(name);
        callDeletion();
        expect(ecpService.delete).toHaveBeenCalledWith(name);
        expect(taskWrapper.wrapTaskAroundCall).toHaveBeenCalledWith({
          task: {
            name: 'ecp/delete',
            metadata: {
              name: name
            }
          },
          call: undefined // because of stub
        });
      };

      beforeEach(() => {
        spyOn(TestBed.get(BsModalService), 'show').and.callFake((deletionClass, config) => {
          deletion = Object.assign(new deletionClass(), config.initialState);
          return {
            content: deletion
          };
        });
        spyOn(ecpService, 'delete').and.stub();
        taskWrapper = TestBed.get(TaskWrapperService);
        spyOn(taskWrapper, 'wrapTaskAroundCall').and.callThrough();
      });

      it('should delete two different erasure code profiles', () => {
        testPoolDeletion('someEcpName');
        testPoolDeletion('aDifferentEcpName');
      });
    });
  });

  describe('submit - create', () => {
    const setMultipleValues = (settings: object) => {
      Object.keys(settings).forEach((name) => {
        formHelper.setValue(name, settings[name]);
      });
    };

    describe('erasure coded pool', () => {
      const expectEcSubmit = (o: any) =>
        expectValidSubmit(
          Object.assign(
            {
              pool: 'ecPool',
              pool_type: 'erasure',
              pg_autoscale_mode: 'off',
              erasure_code_profile: 'ecp1',
              pg_num: 4
            },
            o
          )
        );

      beforeEach(() => {
        setMultipleValues({
          name: 'ecPool',
          poolType: 'erasure',
          pgNum: 4
        });
      });

      it('minimum requirements without ECP to create ec pool', () => {
        // Mock that no ec profiles exist
        infoReturn.erasure_code_profiles = [];
        setUpPoolComponent();
        setMultipleValues({
          name: 'minECPool',
          poolType: 'erasure',
          pgNum: 4
        });
        expectValidSubmit({
          pool: 'minECPool',
          pool_type: 'erasure',
          pg_autoscale_mode: 'off',
          pg_num: 4
        });
      });

      it('creates ec pool with erasure coded profile', () => {
        const ecp = { name: 'ecpMinimalMock' };
        setMultipleValues({
          erasureProfile: ecp
        });
        expectEcSubmit({
          erasure_code_profile: ecp.name
        });
      });

      it('creates ec pool with ec_overwrite flag', () => {
        setMultipleValues({
          ecOverwrites: true
        });
        expectEcSubmit({
          flags: ['ec_overwrites']
        });
      });

      it('should ignore replicated set settings for ec pools', () => {
        setMultipleValues({
          size: 2 // will be ignored
        });
        expectEcSubmit({});
      });

      it('creates a pool with compression', () => {
        setMultipleValues({
          mode: 'passive',
          algorithm: 'lz4',
          minBlobSize: '4 K',
          maxBlobSize: '4 M',
          ratio: 0.7
        });
        expectEcSubmit({
          compression_mode: 'passive',
          compression_algorithm: 'lz4',
          compression_min_blob_size: 4096,
          compression_max_blob_size: 4194304,
          compression_required_ratio: 0.7
        });
      });

      it('creates a pool with application metadata', () => {
        component.data.applications.selected = ['cephfs', 'rgw'];
        expectEcSubmit({
          application_metadata: ['cephfs', 'rgw']
        });
      });
    });

    describe('with replicated pool', () => {
      const expectReplicatedSubmit = (o: any) =>
        expectValidSubmit(
          Object.assign(
            {
              pool: 'repPool',
              pool_type: 'replicated',
              pg_autoscale_mode: 'off',
              pg_num: 16,
              rule_name: 'rep1',
              size: 3
            },
            o
          )
        );
      beforeEach(() => {
        setMultipleValues({
          name: 'repPool',
          poolType: 'replicated',
          crushRule: infoReturn.crush_rules_replicated[0],
          size: 3,
          pgNum: 16
        });
      });

      it('uses the minimum requirements for replicated pools', () => {
        // Mock that no replicated rules exist
        infoReturn.crush_rules_replicated = [];
        setUpPoolComponent();

        setMultipleValues({
          name: 'minRepPool',
          poolType: 'replicated',
          size: 2,
          pgNum: 32
        });
        expectValidSubmit({
          pool: 'minRepPool',
          pool_type: 'replicated',
          pg_num: 32,
          pg_autoscale_mode: 'off',
          size: 2
        });
      });

      it('ignores erasure only set settings for replicated pools', () => {
        setMultipleValues({
          erasureProfile: { name: 'ecpMinimalMock' }, // Will be ignored
          ecOverwrites: true // Will be ignored
        });
        /**
         *  As pgCalc is triggered through profile changes, which is normally not possible,
         *  if type `replicated` is set, pgNum will be set to 256 with the current rule for
         *  a replicated pool.
         */
        expectReplicatedSubmit({
          pg_num: 256
        });
      });

      it('creates a pool with quotas', () => {
        setMultipleValues({
          max_bytes: 1024 * 1024,
          max_objects: 3000
        });
        expectReplicatedSubmit({
          quota_max_bytes: 1024 * 1024,
          quota_max_objects: 3000
        });
      });

      it('creates a pool with rbd qos settings', () => {
        component.currentConfigurationValues = {
          rbd_qos_bps_limit: 55
        };
        expectReplicatedSubmit({
          configuration: {
            rbd_qos_bps_limit: 55
          }
        });
      });
    });
  });

  describe('edit mode', () => {
    const setUrl = (url: string) => {
      Object.defineProperty(router, 'url', { value: url });
      setUpPoolComponent(); // Renew of component needed because the constructor has to be called
    };

    let pool: Pool;
    beforeEach(() => {
      pool = new Pool('somePoolName');
      pool.type = 'replicated';
      pool.size = 3;
      pool.crush_rule = 'rep1';
      pool.pg_num = 32;
      pool.options = {};
      pool.options.compression_mode = 'passive';
      pool.options.compression_algorithm = 'lz4';
      pool.options.compression_min_blob_size = 1024 * 512;
      pool.options.compression_max_blob_size = 1024 * 1024;
      pool.options.compression_required_ratio = 0.8;
      pool.flags_names = 'someFlag1,someFlag2';
      pool.application_metadata = ['rbd', 'ownApp'];
      pool.quota_max_bytes = 1024 * 1024 * 1024;
      pool.quota_max_objects = 3000;

      createCrushRule({ name: 'someRule' });
      spyOn(poolService, 'get').and.callFake(() => of(pool));
    });

    it('is not in edit mode if edit is not included in url', () => {
      setUrl('/pool/add');
      expect(component.editing).toBeFalsy();
    });

    it('is in edit mode if edit is included in url', () => {
      setUrl('/pool/edit/somePoolName');
      expect(component.editing).toBeTruthy();
    });

    describe('after ngOnInit', () => {
      beforeEach(() => {
        setUrl('/pool/edit/somePoolName');
        fixture.detectChanges();
      });

      it('disabled inputs', () => {
        fixture.detectChanges();
        const disabled = ['poolType', 'crushRule', 'size', 'erasureProfile', 'ecOverwrites'];
        disabled.forEach((controlName) => {
          return expect(form.get(controlName).disabled).toBeTruthy();
        });
        const enabled = [
          'name',
          'pgNum',
          'mode',
          'algorithm',
          'minBlobSize',
          'maxBlobSize',
          'ratio',
          'max_bytes',
          'max_objects'
        ];
        enabled.forEach((controlName) => {
          return expect(form.get(controlName).enabled).toBeTruthy();
        });
      });

      it('should include the custom app as valid option', () => {
        expect(
          component.data.applications.available.map((app: Record<string, any>) => app.name)
        ).toEqual(['cephfs', 'ownApp', 'rbd', 'rgw']);
      });

      it('set all control values to the given pool', () => {
        expect(form.getValue('name')).toBe(pool.pool_name);
        expect(form.getValue('poolType')).toBe(pool.type);
        expect(form.getValue('crushRule')).toEqual(component.info.crush_rules_replicated[0]);
        expect(form.getValue('size')).toBe(pool.size);
        expect(form.getValue('pgNum')).toBe(pool.pg_num);
        expect(form.getValue('mode')).toBe(pool.options.compression_mode);
        expect(form.getValue('algorithm')).toBe(pool.options.compression_algorithm);
        expect(form.getValue('minBlobSize')).toBe('512 KiB');
        expect(form.getValue('maxBlobSize')).toBe('1 MiB');
        expect(form.getValue('ratio')).toBe(pool.options.compression_required_ratio);
        expect(form.getValue('max_bytes')).toBe('1 GiB');
        expect(form.getValue('max_objects')).toBe(pool.quota_max_objects);
      });

      it('updates pgs on every change', () => {
        testPgUpdate(undefined, -1, 16);
        testPgUpdate(undefined, -1, 8);
      });

      it('is possible to use less or more pgs than before', () => {
        formHelper.expectValid(setPgNum(64));
        formHelper.expectValid(setPgNum(4));
      });

      describe('submit', () => {
        const markControlAsPreviouslySet = (controlName: string) =>
          form.get(controlName).markAsPristine();

        beforeEach(() => {
          ['algorithm', 'maxBlobSize', 'minBlobSize', 'mode', 'pgNum', 'ratio', 'name'].forEach(
            (name) => markControlAsPreviouslySet(name)
          );
          fixture.detectChanges();
        });

        it(`always provides the application metadata array with submit even if it's empty`, () => {
          expect(form.get('mode').dirty).toBe(false);
          component.data.applications.selected = [];
          expectValidSubmit(
            {
              application_metadata: [],
              pool: 'somePoolName'
            },
            'pool/edit',
            'update'
          );
        });

        it(`will always provide reset value for compression options`, () => {
          formHelper.setValue('minBlobSize', '').markAsDirty();
          formHelper.setValue('maxBlobSize', '').markAsDirty();
          formHelper.setValue('ratio', '').markAsDirty();
          expectValidSubmit(
            {
              application_metadata: ['ownApp', 'rbd'],
              compression_max_blob_size: 0,
              compression_min_blob_size: 0,
              compression_required_ratio: 0,
              pool: 'somePoolName'
            },
            'pool/edit',
            'update'
          );
        });

        it(`will unset mode not used anymore`, () => {
          formHelper.setValue('mode', 'none').markAsDirty();
          expectValidSubmit(
            {
              application_metadata: ['ownApp', 'rbd'],
              compression_mode: 'unset',
              pool: 'somePoolName'
            },
            'pool/edit',
            'update'
          );
        });
      });
    });
  });

  describe('test pool configuration component', () => {
    it('is visible for replicated pools with rbd application', () => {
      const poolType = component.form.get('poolType');
      poolType.markAsDirty();
      poolType.setValue('replicated');
      component.data.applications.selected = ['rbd'];
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('cd-rbd-configuration-form')).nativeElement.parentElement
          .hidden
      ).toBe(false);
    });

    it('is invisible for erasure coded pools', () => {
      const poolType = component.form.get('poolType');
      poolType.markAsDirty();
      poolType.setValue('erasure');
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('cd-rbd-configuration-form')).nativeElement.parentElement
          .hidden
      ).toBe(true);
    });
  });
});
