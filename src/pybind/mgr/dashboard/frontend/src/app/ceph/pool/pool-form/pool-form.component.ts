import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { I18n } from '@ngx-translate/i18n-polyfill';
import * as _ from 'lodash';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

import { ConfigurationService } from '../../../shared/api/configuration.service';
import { ErasureCodeProfileService } from '../../../shared/api/erasure-code-profile.service';
import { PoolService } from '../../../shared/api/pool.service';
import { CriticalConfirmationModalComponent } from '../../../shared/components/critical-confirmation-modal/critical-confirmation-modal.component';
import { SelectOption } from '../../../shared/components/select/select-option.model';
import { ActionLabelsI18n, URLVerbs } from '../../../shared/constants/app.constants';
import { Icons } from '../../../shared/enum/icons.enum';
import { CdFormGroup } from '../../../shared/forms/cd-form-group';
import { CdValidators } from '../../../shared/forms/cd-validators';
import {
  RbdConfigurationEntry,
  RbdConfigurationSourceField
} from '../../../shared/models/configuration';
import { CrushRule } from '../../../shared/models/crush-rule';
import { CrushStep } from '../../../shared/models/crush-step';
import { ErasureCodeProfile } from '../../../shared/models/erasure-code-profile';
import { FinishedTask } from '../../../shared/models/finished-task';
import { Permission } from '../../../shared/models/permissions';
import { PoolFormInfo } from '../../../shared/models/pool-form-info';
import { DimlessBinaryPipe } from '../../../shared/pipes/dimless-binary.pipe';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';
import { FormatterService } from '../../../shared/services/formatter.service';
import { TaskWrapperService } from '../../../shared/services/task-wrapper.service';
import { ErasureCodeProfileFormComponent } from '../erasure-code-profile-form/erasure-code-profile-form.component';
import { Pool } from '../pool';
import { PoolFormData } from './pool-form-data';

interface FormFieldDescription {
  externalFieldName: string;
  formControlName: string;
  attr?: string;
  replaceFn?: Function;
  editable?: boolean;
  resetValue?: any;
}

@Component({
  selector: 'cd-pool-form',
  templateUrl: './pool-form.component.html',
  styleUrls: ['./pool-form.component.scss']
})
export class PoolFormComponent implements OnInit {
  permission: Permission;
  form: CdFormGroup;
  ecProfiles: ErasureCodeProfile[];
  info: PoolFormInfo;
  routeParamsSubscribe: any;
  editing = false;
  isReplicated = false;
  isErasure = false;
  data = new PoolFormData(this.i18n);
  externalPgChange = false;
  current: Record<string, any> = {
    rules: []
  };
  initializeConfigData = new EventEmitter<{
    initialData: RbdConfigurationEntry[];
    sourceType: RbdConfigurationSourceField;
  }>();
  currentConfigurationValues: { [configKey: string]: any } = {};
  action: string;
  resource: string;
  icons = Icons;
  pgAutoscaleModes: string[];

  private crushRuleValidators: ValidatorFn[];
  private modalSubscription: Subscription;

  constructor(
    private dimlessBinaryPipe: DimlessBinaryPipe,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private poolService: PoolService,
    private configurationService: ConfigurationService,
    private authStorageService: AuthStorageService,
    private formatter: FormatterService,
    private bsModalService: BsModalService,
    private taskWrapper: TaskWrapperService,
    private ecpService: ErasureCodeProfileService,
    private i18n: I18n,
    public actionLabels: ActionLabelsI18n
  ) {
    this.editing = this.router.url.startsWith(`/pool/${URLVerbs.EDIT}`);
    this.action = this.editing ? this.actionLabels.EDIT : this.actionLabels.CREATE;
    this.resource = this.i18n('pool');
    this.authenticate();
    this.createForm();
  }

  authenticate() {
    this.permission = this.authStorageService.getPermissions().pool;
    if (
      !this.permission.read ||
      ((!this.permission.update && this.editing) || (!this.permission.create && !this.editing))
    ) {
      this.router.navigate(['/404']);
    }
  }

  private createForm() {
    this.crushRuleValidators = [
      CdValidators.custom(
        'tooFewOsds',
        (rule: any) => this.info && rule && this.info.osd_count < rule.min_size
      )
    ];
    const compressionForm = new CdFormGroup({
      mode: new FormControl('none'),
      algorithm: new FormControl(''),
      minBlobSize: new FormControl('', {
        updateOn: 'blur'
      }),
      maxBlobSize: new FormControl('', {
        updateOn: 'blur'
      }),
      ratio: new FormControl('', {
        updateOn: 'blur'
      })
    });

    this.form = new CdFormGroup(
      {
        name: new FormControl('', {
          validators: [
            Validators.pattern(/^[.A-Za-z0-9_/-]+$/),
            Validators.required,
            CdValidators.custom('rbdPool', () => {
              return (
                this.form &&
                this.form.getValue('name').includes('/') &&
                this.data &&
                this.data.applications.selected.indexOf('rbd') !== -1
              );
            })
          ]
        }),
        poolType: new FormControl('', {
          validators: [Validators.required]
        }),
        crushRule: new FormControl(null, {
          validators: this.crushRuleValidators
        }),
        size: new FormControl('', {
          updateOn: 'blur'
        }),
        erasureProfile: new FormControl(null),
        pgNum: new FormControl('', {
          validators: [Validators.required, Validators.min(1)]
        }),
        pgAutoscaleMode: new FormControl(null),
        ecOverwrites: new FormControl(false),
        compression: compressionForm,
        max_bytes: new FormControl(''),
        max_objects: new FormControl(0, {
          validators: [Validators.min(0)]
        })
      },
      [CdValidators.custom('form', (): null => null)]
    );
  }

  ngOnInit() {
    this.poolService.getInfo().subscribe((info: PoolFormInfo) => {
      this.initInfo(info);
      if (this.editing) {
        this.initEditMode();
      } else {
        this.setAvailableApps();
      }
      this.listenToChanges();
      this.setComplexValidators();
    });
  }

  private initInfo(info: PoolFormInfo) {
    const pgAutoscaleConfig = info.pg_autoscale_config;
    this.pgAutoscaleModes = pgAutoscaleConfig.enum_values;
    this.form.silentSet(
      'pgAutoscaleMode',
      this.configurationService.getValue(pgAutoscaleConfig, 'mon')
    );
    this.form.silentSet('algorithm', info.bluestore_compression_algorithm);
    if (info.crush_rules_replicated.length > 1) {
      this.crushRuleValidators.push(Validators.required);
      this.form.get('crushRule').setValidators(this.crushRuleValidators);
    }
    this.info = info;
    this.initEcp(info.erasure_code_profiles);
  }

  private initEcp(ecProfiles: ErasureCodeProfile[]) {
    this.setListControlStatus('erasureProfile', ecProfiles);
    this.ecProfiles = ecProfiles;
  }

  private setListControlStatus(controlName: string, arr: any[]) {
    const control = this.form.get(controlName);
    if (arr.length === 1) {
      control.setValue(arr[0]);
    }
    if (arr.length <= 1) {
      control.disable();
    } else if (control.disabled) {
      control.enable();
    }
  }

  private initEditMode() {
    this.disableForEdit();
    this.routeParamsSubscribe = this.route.params.subscribe((param: { name: string }) =>
      this.poolService.get(param.name).subscribe((pool: Pool) => {
        this.data.pool = pool;
        this.initEditFormData(pool);
      })
    );
  }

  private disableForEdit() {
    ['poolType', 'crushRule', 'size', 'erasureProfile', 'ecOverwrites'].forEach((controlName) =>
      this.form.get(controlName).disable()
    );
  }

  private initEditFormData(pool: Pool) {
    this.initializeConfigData.emit({
      initialData: pool.configuration,
      sourceType: RbdConfigurationSourceField.pool
    });
    this.rulesChange(pool.type);
    const rules = this.info.crush_rules_replicated.concat(this.info.crush_rules_erasure);
    const dataMap = {
      name: pool.pool_name,
      poolType: pool.type,
      crushRule: rules.find((rule: CrushRule) => rule.rule_name === pool.crush_rule),
      size: pool.size,
      erasureProfile: this.ecProfiles.find((ecp) => ecp.name === pool.erasure_code_profile),
      pgAutoscaleMode: pool.pg_autoscale_mode,
      pgNum: pool.pg_num,
      ecOverwrites: pool.flags_names.includes('ec_overwrites'),
      mode: pool.options.compression_mode,
      algorithm: pool.options.compression_algorithm,
      minBlobSize: this.dimlessBinaryPipe.transform(pool.options.compression_min_blob_size),
      maxBlobSize: this.dimlessBinaryPipe.transform(pool.options.compression_max_blob_size),
      ratio: pool.options.compression_required_ratio,
      max_bytes: this.dimlessBinaryPipe.transform(pool.quota_max_bytes),
      max_objects: pool.quota_max_objects
    };
    Object.keys(dataMap).forEach((controlName: string) => {
      const value = dataMap[controlName];
      if (!_.isUndefined(value) && value !== '') {
        this.form.silentSet(controlName, value);
      }
    });
    this.data.pgs = this.form.getValue('pgNum');
    this.setAvailableApps(this.data.applications.default.concat(pool.application_metadata));
    this.data.applications.selected = pool.application_metadata;
  }

  private setAvailableApps(apps: string[] = this.data.applications.default) {
    this.data.applications.available = _.uniq(apps.sort()).map(
      (x: string) => new SelectOption(false, x, '')
    );
  }

  private listenToChanges() {
    this.listenToChangesDuringAddEdit();
    if (!this.editing) {
      this.listenToChangesDuringAdd();
    }
  }

  private listenToChangesDuringAddEdit() {
    this.form.get('pgNum').valueChanges.subscribe((pgs) => {
      const change = pgs - this.data.pgs;
      if (Math.abs(change) !== 1 || pgs === 2) {
        this.data.pgs = pgs;
        return;
      }
      this.doPgPowerJump(change as 1 | -1);
    });
  }

  private doPgPowerJump(jump: 1 | -1) {
    const power = this.calculatePgPower() + jump;
    this.setPgs(jump === -1 ? Math.round(power) : Math.floor(power));
  }

  private calculatePgPower(pgs = this.form.getValue('pgNum')): number {
    return Math.log(pgs) / Math.log(2);
  }

  private setPgs(power: number) {
    const pgs = Math.pow(2, power < 0 ? 0 : power); // Set size the nearest accurate size.
    this.data.pgs = pgs;
    this.form.silentSet('pgNum', pgs);
  }

  private listenToChangesDuringAdd() {
    this.form.get('poolType').valueChanges.subscribe((poolType) => {
      this.rulesChange(poolType);
    });
    this.form.get('crushRule').valueChanges.subscribe(() => {
      // The crush rule can only be changed if type 'replicated' is set.
      this.replicatedRuleChange();
      this.pgCalc();
    });
    this.form.get('size').valueChanges.subscribe(() => {
      // The size can only be changed if type 'replicated' is set.
      this.pgCalc();
    });
    this.form.get('erasureProfile').valueChanges.subscribe(() => {
      // The ec profile can only be changed if type 'erasure' is set.
      this.pgCalc();
    });
    this.form.get('mode').valueChanges.subscribe(() => {
      ['minBlobSize', 'maxBlobSize', 'ratio'].forEach((name) => {
        this.form.get(name).updateValueAndValidity({ emitEvent: false });
      });
    });
    this.form.get('minBlobSize').valueChanges.subscribe(() => {
      this.form.get('maxBlobSize').updateValueAndValidity({ emitEvent: false });
    });
    this.form.get('maxBlobSize').valueChanges.subscribe(() => {
      this.form.get('minBlobSize').updateValueAndValidity({ emitEvent: false });
    });
  }

  private rulesChange(poolType: string) {
    if (poolType === 'replicated') {
      this.setTypeBooleans(true, false);
    } else if (poolType === 'erasure') {
      this.setTypeBooleans(false, true);
    } else {
      this.setTypeBooleans(false, false);
    }
    if (!poolType || !this.info) {
      this.current.rules = [];
      return;
    }
    const rules = this.info['crush_rules_' + poolType] || [];
    this.current.rules = rules;
    if (this.editing) {
      return;
    }
    const control = this.form.get('crushRule');
    if (rules.length === 1) {
      control.setValue(rules[0]);
      control.disable();
    } else {
      control.setValue(null);
      control.enable();
    }
    this.replicatedRuleChange();
    this.pgCalc();
  }

  private setTypeBooleans(replicated: boolean, erasure: boolean) {
    this.isReplicated = replicated;
    this.isErasure = erasure;
  }

  private replicatedRuleChange() {
    if (!this.isReplicated) {
      return;
    }
    const control = this.form.get('size');
    let size = this.form.getValue('size') || 3;
    const min = this.getMinSize();
    const max = this.getMaxSize();
    if (size < min) {
      size = min;
    } else if (size > max) {
      size = max;
    }
    if (size !== control.value) {
      this.form.silentSet('size', size);
    }
  }

  getMinSize(): number {
    if (!this.info || this.info.osd_count < 1) {
      return 0;
    }
    const rule = this.form.getValue('crushRule');
    if (rule) {
      return rule.min_size;
    }
    return 1;
  }

  getMaxSize(): number {
    if (!this.info || this.info.osd_count < 1) {
      return 0;
    }
    const osds: number = this.info.osd_count;
    if (this.form.getValue('crushRule')) {
      const max: number = this.form.get('crushRule').value.max_size;
      if (max < osds) {
        return max;
      }
    }
    return osds;
  }

  private pgCalc() {
    const poolType = this.form.getValue('poolType');
    if (!this.info || this.form.get('pgNum').dirty || !poolType) {
      return;
    }
    const pgMax = this.info.osd_count * 100;
    const pgs = this.isReplicated ? this.replicatedPgCalc(pgMax) : this.erasurePgCalc(pgMax);
    if (!pgs) {
      return;
    }
    const oldValue = this.data.pgs;
    this.alignPgs(pgs);
    const newValue = this.data.pgs;
    if (!this.externalPgChange) {
      this.externalPgChange = oldValue !== newValue;
    }
  }

  private replicatedPgCalc(pgs: number): number {
    const sizeControl = this.form.get('size');
    const size = sizeControl.value;
    return sizeControl.valid && size > 0 ? pgs / size : 0;
  }

  private erasurePgCalc(pgs: number): number {
    const ecpControl = this.form.get('erasureProfile');
    const ecp = ecpControl.value;
    return (ecpControl.valid || ecpControl.disabled) && ecp ? pgs / (ecp.k + ecp.m) : 0;
  }

  private alignPgs(pgs = this.form.getValue('pgNum')) {
    this.setPgs(Math.round(this.calculatePgPower(pgs < 1 ? 1 : pgs)));
  }

  private setComplexValidators() {
    if (this.editing) {
      this.form
        .get('name')
        .setValidators([
          this.form.get('name').validator,
          CdValidators.custom(
            'uniqueName',
            (name: string) =>
              this.data.pool &&
              this.info &&
              this.info.pool_names.indexOf(name) !== -1 &&
              this.info.pool_names.indexOf(name) !==
                this.info.pool_names.indexOf(this.data.pool.pool_name)
          )
        ]);
    } else {
      CdValidators.validateIf(this.form.get('size'), () => this.isReplicated, [
        CdValidators.custom(
          'min',
          (value: number) => this.form.getValue('size') && value < this.getMinSize()
        ),
        CdValidators.custom(
          'max',
          (value: number) => this.form.getValue('size') && this.getMaxSize() < value
        )
      ]);
      this.form
        .get('name')
        .setValidators([
          this.form.get('name').validator,
          CdValidators.custom(
            'uniqueName',
            (name: string) => this.info && this.info.pool_names.indexOf(name) !== -1
          )
        ]);
    }
    this.setCompressionValidators();
  }

  private setCompressionValidators() {
    CdValidators.validateIf(this.form.get('minBlobSize'), () => this.hasCompressionEnabled(), [
      Validators.min(0),
      CdValidators.custom('maximum', (size: string) =>
        this.oddBlobSize(size, this.form.getValue('maxBlobSize'))
      )
    ]);
    CdValidators.validateIf(this.form.get('maxBlobSize'), () => this.hasCompressionEnabled(), [
      Validators.min(0),
      CdValidators.custom('minimum', (size: string) =>
        this.oddBlobSize(this.form.getValue('minBlobSize'), size)
      )
    ]);
    CdValidators.validateIf(this.form.get('ratio'), () => this.hasCompressionEnabled(), [
      Validators.min(0),
      Validators.max(1)
    ]);
  }

  private oddBlobSize(minimum: string, maximum: string) {
    const min = this.formatter.toBytes(minimum);
    const max = this.formatter.toBytes(maximum);
    return Boolean(min && max && min >= max);
  }

  hasCompressionEnabled() {
    return this.form.getValue('mode') && this.form.get('mode').value.toLowerCase() !== 'none';
  }

  describeCrushStep(step: CrushStep) {
    return [
      step.op.replace('_', ' '),
      step.item_name || '',
      step.type ? step.num + ' type ' + step.type : ''
    ].join(' ');
  }

  addErasureCodeProfile() {
    this.modalSubscription = this.modalService.onHide.subscribe(() => this.reloadECPs());
    this.bsModalService.show(ErasureCodeProfileFormComponent);
  }

  private reloadECPs() {
    this.ecpService.list().subscribe((profiles: ErasureCodeProfile[]) => this.initEcp(profiles));
    this.modalSubscription.unsubscribe();
  }

  deleteErasureCodeProfile() {
    const ecp = this.form.getValue('erasureProfile');
    if (!ecp) {
      return;
    }
    const name = ecp.name;
    this.modalSubscription = this.modalService.onHide.subscribe(() => this.reloadECPs());
    this.modalService.show(CriticalConfirmationModalComponent, {
      initialState: {
        itemDescription: this.i18n('erasure code profile'),
        itemNames: [name],
        submitActionObservable: () =>
          this.taskWrapper.wrapTaskAroundCall({
            task: new FinishedTask('ecp/delete', { name: name }),
            call: this.ecpService.delete(name)
          })
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.setErrors({ cdSubmitButton: true });
      return;
    }

    const pool = { pool: this.form.getValue('name') };

    this.assignFormFields(pool, [
      { externalFieldName: 'pool_type', formControlName: 'poolType' },
      {
        externalFieldName: 'pg_autoscale_mode',
        formControlName: 'pgAutoscaleMode',
        editable: true
      },
      {
        externalFieldName: 'pg_num',
        formControlName: 'pgNum',
        replaceFn: (value: number) => (this.form.getValue('pgAutoscaleMode') === 'on' ? 1 : value),
        editable: true
      },
      this.isReplicated
        ? { externalFieldName: 'size', formControlName: 'size' }
        : {
            externalFieldName: 'erasure_code_profile',
            formControlName: 'erasureProfile',
            attr: 'name'
          },
      { externalFieldName: 'rule_name', formControlName: 'crushRule', attr: 'rule_name' },
      {
        externalFieldName: 'quota_max_bytes',
        formControlName: 'max_bytes',
        replaceFn: this.formatter.toBytes,
        editable: true,
        resetValue: this.editing ? 0 : undefined
      },
      {
        externalFieldName: 'quota_max_objects',
        formControlName: 'max_objects',
        editable: true,
        resetValue: this.editing ? 0 : undefined
      }
    ]);

    if (this.info.is_all_bluestore) {
      this.assignFormField(pool, {
        externalFieldName: 'flags',
        formControlName: 'ecOverwrites',
        replaceFn: () => (this.isErasure ? ['ec_overwrites'] : undefined)
      });

      if (this.form.getValue('mode') !== 'none') {
        this.assignFormFields(pool, [
          {
            externalFieldName: 'compression_mode',
            formControlName: 'mode',
            editable: true,
            replaceFn: (value: boolean) => this.hasCompressionEnabled() && value
          },
          {
            externalFieldName: 'compression_algorithm',
            formControlName: 'algorithm',
            editable: true
          },
          {
            externalFieldName: 'compression_min_blob_size',
            formControlName: 'minBlobSize',
            replaceFn: this.formatter.toBytes,
            editable: true,
            resetValue: 0
          },
          {
            externalFieldName: 'compression_max_blob_size',
            formControlName: 'maxBlobSize',
            replaceFn: this.formatter.toBytes,
            editable: true,
            resetValue: 0
          },
          {
            externalFieldName: 'compression_required_ratio',
            formControlName: 'ratio',
            editable: true,
            resetValue: 0
          }
        ]);
      } else if (this.editing) {
        this.assignFormFields(pool, [
          {
            externalFieldName: 'compression_mode',
            formControlName: 'mode',
            editable: true,
            replaceFn: () => 'unset' // Is used if no compression is set
          },
          {
            externalFieldName: 'srcpool',
            formControlName: 'name',
            editable: true,
            replaceFn: () => this.data.pool.pool_name
          }
        ]);
      }
    }

    const apps = this.data.applications.selected;
    if (apps.length > 0 || this.editing) {
      pool['application_metadata'] = apps;
    }

    // Only collect configuration data for replicated pools, as QoS cannot be configured on EC
    // pools. EC data pools inherit their settings from the corresponding replicated metadata pool.
    if (this.isReplicated && !_.isEmpty(this.currentConfigurationValues)) {
      pool['configuration'] = this.currentConfigurationValues;
    }

    this.triggerApiTask(pool);
  }

  /**
   * Retrieves the values for the given form field descriptions and assigns the values to the given
   * object. This method differentiates between `add` and `edit` mode and acts differently on one or
   * the other.
   */
  private assignFormFields(pool: object, formFieldDescription: FormFieldDescription[]): void {
    formFieldDescription.forEach((item) => this.assignFormField(pool, item));
  }

  /**
   * Retrieves the value for the given form field description and assigns the values to the given
   * object. This method differentiates between `add` and `edit` mode and acts differently on one or
   * the other.
   */
  private assignFormField(
    pool: object,
    {
      externalFieldName,
      formControlName,
      attr,
      replaceFn,
      editable,
      resetValue
    }: FormFieldDescription
  ): void {
    if (this.editing && (!editable || this.form.get(formControlName).pristine)) {
      return;
    }
    const value = this.form.getValue(formControlName);
    let apiValue = replaceFn ? replaceFn(value) : attr ? _.get(value, attr) : value;
    if (!value || !apiValue) {
      if (editable && !_.isUndefined(resetValue)) {
        apiValue = resetValue;
      } else {
        return;
      }
    }
    pool[externalFieldName] = apiValue;
  }

  private triggerApiTask(pool: Record<string, any>) {
    this.taskWrapper
      .wrapTaskAroundCall({
        task: new FinishedTask('pool/' + (this.editing ? URLVerbs.EDIT : URLVerbs.CREATE), {
          pool_name: pool.hasOwnProperty('srcpool') ? pool.srcpool : pool.pool
        }),
        call: this.poolService[this.editing ? URLVerbs.UPDATE : URLVerbs.CREATE](pool)
      })
      .subscribe(
        undefined,
        (resp) => {
          if (_.isObject(resp.error) && resp.error.code === '34') {
            this.form.get('pgNum').setErrors({ '34': true });
          }
          this.form.setErrors({ cdSubmitButton: true });
        },
        () => this.router.navigate(['/pool'])
      );
  }

  appSelection() {
    this.form.get('name').updateValueAndValidity({ emitEvent: false, onlySelf: true });
  }
}
