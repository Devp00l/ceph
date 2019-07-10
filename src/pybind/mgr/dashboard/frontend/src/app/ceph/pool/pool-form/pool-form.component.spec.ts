import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ToastModule } from 'ng2-toastr';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
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

  const setPgNum = (pgs): AbstractControl => {
    const control = formHelper.setValue('pgNum', pgs);
    fixture.debugElement.query(By.css('#pgNum')).nativeElement.dispatchEvent(new Event('blur'));
    return control;
  };

  const testPgUpdate = (pgs, jump, returnValue) => {
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
    component.info['crush_rules_' + type].push(rule);
    return rule;
  };

  const expectValidSubmit = (
    pool: any,
    taskName: string,
    poolServiceMethod: 'create' | 'update'
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

  const setUpPoolComponent = () => {
    fixture = TestBed.createComponent(PoolFormComponent);
    fixtureHelper = new FixtureHelper(fixture);
    component = fixture.componentInstance;
    component.info = {
      pool_names: [],
      osd_count: OSDS,
      is_all_bluestore: true,
      bluestore_compression_algorithm: 'snappy',
      compression_algorithms: ['snappy'],
      compression_modes: ['none', 'passive'],
      crush_rules_replicated: [],
      crush_rules_erasure: []
    };
    const ecp1 = new ErasureCodeProfile();
    ecp1.name = 'ecp1';
    component.ecProfiles = [ecp1];
    form = component.form;
    formHelper = new FormHelper(form);
  };

  const routes: Routes = [{ path: '404', component: NotFoundComponent }];

  configureTestBed({
    declarations: [NotFoundComponent],
    imports: [
      HttpClientTestingModule,
      RouterTestingModule.withRoutes(routes),
      ToastModule.forRoot(),
      TabsModule.forRoot(),
      PoolModule
    ],
    providers: [
      ErasureCodeProfileService,
      SelectBadgesComponent,
      { provide: ActivatedRoute, useValue: { params: of({ name: 'somePoolName' }) } },
      i18nProviders
    ]
  });

  beforeEach(() => {
    setUpPoolComponent();
    poolService = TestBed.get(PoolService);
    spyOn(poolService, 'getInfo').and.callFake(() => [component.info]);
    ecpService = TestBed.get(ErasureCodeProfileService);
    spyOn(ecpService, 'list').and.callFake(() => [component.ecProfiles]);
    router = TestBed.get(Router);
    spyOn(router, 'navigate').and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('submit - create', () => {
    const setMultipleValues = (settings: {}) => {
      Object.keys(settings).forEach((name) => {
        formHelper.setValue(name, settings[name]);
      });
    };
    const testCreate = (pool) => {
      expectValidSubmit(pool, 'pool/create', 'create');
    };

    beforeEach(() => {
      createCrushRule({ name: 'replicatedRule' });
      createCrushRule({ name: 'erasureRule', type: 'erasure', id: 1 });
    });

    describe('erasure coded pool', () => {
      it('minimum requirements', () => {
        setMultipleValues({
          name: 'minECPool',
          poolType: 'erasure',
          pgNum: 4
        });
        testCreate({
          pool: 'minECPool',
          pool_type: 'erasure',
          pg_num: 4
        });
      });

      it('with erasure coded profile', () => {
        const ecp = { name: 'ecpMinimalMock' };
        setMultipleValues({
          name: 'ecpPool',
          poolType: 'erasure',
          pgNum: 16,
          size: 2, // Will be ignored
          erasureProfile: ecp
        });
        testCreate({
          pool: 'ecpPool',
          pool_type: 'erasure',
          pg_num: 16,
          erasure_code_profile: ecp.name
        });
      });

      it('with ec_overwrite flag', () => {
        setMultipleValues({
          name: 'ecOverwrites',
          poolType: 'erasure',
          pgNum: 32,
          ecOverwrites: true
        });
        testCreate({
          pool: 'ecOverwrites',
          pool_type: 'erasure',
          pg_num: 32,
          flags: ['ec_overwrites']
        });
      });

      it('with rbd qos settings', () => {
        setMultipleValues({
          name: 'replicatedRbdQos',
          poolType: 'replicated',
          size: 2,
          pgNum: 32
        });
        component.currentConfigurationValues = {
          rbd_qos_bps_limit: 55
        };
        testCreate({
          pool: 'replicatedRbdQos',
          pool_type: 'replicated',
          size: 2,
          pg_num: 32,
          configuration: {
            rbd_qos_bps_limit: 55
          }
        });
      });
    });

    describe('replicated coded pool', () => {
      it('minimum requirements', () => {
        const ecp = { name: 'ecpMinimalMock' };
        setMultipleValues({
          name: 'minRepPool',
          poolType: 'replicated',
          size: 2,
          erasureProfile: ecp, // Will be ignored
          pgNum: 8
        });
        testCreate({
          pool: 'minRepPool',
          pool_type: 'replicated',
          pg_num: 8,
          size: 2
        });
      });

      it('with quotas', () => {
        setMultipleValues({
          name: 'RepPoolWithQuotas',
          poolType: 'replicated',
          max_bytes: 1024 * 1024,
          max_objects: 3000,
          pgNum: 8
        });
        testCreate({
          pool: 'RepPoolWithQuotas',
          pool_type: 'replicated',
          quota_max_bytes: 1024 * 1024,
          quota_max_objects: 3000,
          pg_num: 8
        });
      });
    });

    it('pool with compression', () => {
      setMultipleValues({
        name: 'compression',
        poolType: 'erasure',
        pgNum: 64,
        mode: 'passive',
        algorithm: 'lz4',
        minBlobSize: '4 K',
        maxBlobSize: '4 M',
        ratio: 0.7
      });
      testCreate({
        pool: 'compression',
        pool_type: 'erasure',
        pg_num: 64,
        compression_mode: 'passive',
        compression_algorithm: 'lz4',
        compression_min_blob_size: 4096,
        compression_max_blob_size: 4194304,
        compression_required_ratio: 0.7
      });
    });

    it('pool with application metadata', () => {
      setMultipleValues({
        name: 'apps',
        poolType: 'erasure',
        pgNum: 128
      });
      component.data.applications.selected = ['cephfs', 'rgw'];
      testCreate({
        pool: 'apps',
        pool_type: 'erasure',
        pg_num: 128,
        application_metadata: ['cephfs', 'rgw']
      });
    });
  });

  describe('edit mode', () => {
    const setUrl = (url) => {
      Object.defineProperty(router, 'url', { value: url });
      setUpPoolComponent(); // Renew of component needed because the constructor has to be called
    };

    let pool: Pool;
    beforeEach(() => {
      pool = new Pool('somePoolName');
      pool.type = 'replicated';
      pool.size = 3;
      pool.crush_rule = 'someRule';
      pool.pg_num = 32;
      pool.options = {};
      pool.options.compression_mode = 'passive';
      pool.options.compression_algorithm = 'lz4';
      pool.options.compression_min_blob_size = 1024 * 512;
      pool.options.compression_max_blob_size = 1024 * 1024;
      pool.options.compression_required_ratio = 0.8;
      pool.flags_names = 'someFlag1,someFlag2';
      pool.application_metadata = ['rbd', 'rgw'];
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
        component.editing = true;
        fixture.detectChanges();
      });

      it('disabled inputs', () => {
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
        const markControlAsPreviouslySet = (controlName) => form.get(controlName).markAsPristine();

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
              application_metadata: ['rbd', 'rgw'],
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
              application_metadata: ['rbd', 'rgw'],
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
