import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfigurationService } from '../../../../shared/api/configuration.service';
import { NotificationType } from '../../../../shared/enum/notification-type.enum';
import { CdFormGroup } from '../../../../shared/forms/cd-form-group';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfigFormCreateRequestModel } from './configuration-form-create-request.model';
import { ConfigFormModel } from './configuration-form.model';

@Component({
  selector: 'cd-configuration-form',
  templateUrl: './configuration-form.component.html',
  styleUrls: ['./configuration-form.component.scss']
})
export class ConfigurationFormComponent implements OnInit {
  configForm: CdFormGroup;
  response: ConfigFormModel; //rename to option??
  type: string;
  minValue: number;
  maxValue: number;
  availSections = ['global', 'mon', 'mgr', 'osd', 'mds', 'client'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigurationService,
    private notificationService: NotificationService
  ) {
    this.createForm();
  }

  createForm() {
    const formControls = {
      name: new FormControl({ value: null, disabled: true }),
      desc: new FormControl({ value: null, disabled: true }),
      long_desc: new FormControl({ value: null, disabled: true }),
      values: new FormGroup({}),
      default: new FormControl({ value: null, disabled: true }),
      daemon_default: new FormControl({ value: null, disabled: true }),
      services: new FormControl([])
    };

    this.availSections.forEach(function(section) {
      formControls.values.controls[section] = new FormControl(null);
    });

    this.configForm = new CdFormGroup(formControls);
    this.configForm._filterValue = function(value) {
      return value;
    };
  }

  ngOnInit() {
    this.route.params.subscribe((params: { name: string }) => {
      const configName = params.name;
      this.configService.get(configName).subscribe((resp: ConfigFormModel) => {
        this.setResponse(resp);
      });
    });
  }

  isNumber(type: string): boolean {
    return ['uint64_t', 'int64_t', 'size_t', 'double', 'secs'].includes(type);
  }

  getInputType(type: string): string {
    const numbers = ['uint64_t', 'int64_t', 'size_t', 'secs'];
    const texts = ['double', 'std::string', 'entity_addr_t', 'uuid_d'];
    const checkboxes = ['bool'];
    if (numbers.includes(type)) {
      return 'number';
    } else if (texts.includes(type)) {
      return 'text';
    } else {
      return 'checkbox';
    }
  }

  getPatternHelpText(type: string): string {
    if (type === 'double') {
      return 'The entered value needs to be a number or decimal.';
    } else if (type === 'entity_addr_t') {
      return 'The entered value needs to be a valid IP address.';
    } else if (type === 'uuid_d') {
      // not accurate in current version because of line breaks
      return `The entered value doesn't match the valid pattern
      ([a-z0-9]{{ '{' }}8{{ '}' }}-[a-z0-9]{{ '{' }}4{{ '}' }}-
      [a-z0-9]{{ '{' }}4{{ '}' }}-[a-z0-9]{{ '{' }}4{{ '}' }}-[a-z0-9]{{ '{' }}12{{ '}' }}).`;
    }
  }

  makeTypeHumanReadable(type: string): string {
    return type; // make type human understandable
  }

  getValidators(configOption: any): Validators[] {
    const validators = [];

    if (this.isNumber(configOption.type)) {
      return this.numberValidator(configOption);
    } else if (configOption.type === 'entity_addr_t') {
      validators.push(this.addressValidator(configOption));
    } else if (configOption.type === 'uuid_d') {
      validators.push(
        Validators.pattern('[a-z0-9]{8}\\-[a-z0-9]{4}\\-[a-z0-9]{4}\\-[a-z0-9]{4}\\-[a-z0-9]{12}')
      );
    }
    return validators;
  }

  private numberValidator(configOption): Validators[] {
    const validators = [];
    if (configOption.max && configOption.max !== '') {
      this.maxValue = configOption.max;
      validators.push(Validators.max(configOption.max));
    }
    if (configOption.min && configOption.min !== '') {
      this.minValue = configOption.min;
      validators.push(Validators.min(configOption.min));
    }
    if (configOption.type === 'double') {
      validators.push(Validators.pattern('-?[0-9]+(.[0-9]+)?')); // why not treat it as number?
    }
    return validators;
  }

  private addressValidator(configOption): Validators {
    const ipv4Ipv6Rgx =
      '(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|' +
      '2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z]|[A-Za-z]' +
      '[A-Za-z0-9-]*[A-Za-z0-9])$|^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|((' +
      '[0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d' +
      '|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|' +
      '2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}' +
      '(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)' +
      '(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4})' +
      '{1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|' +
      '1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|' +
      '((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d))' +
      '{3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:' +
      '((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:' +
      '[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)' +
      '(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*';
    return Validators.pattern(ipv4Ipv6Rgx);
  }

  setResponse(response: ConfigFormModel) {
    this.response = response;
    console.log(response);
    const validators = this.getValidators(response);

    this.configForm.get('name').setValue(response.name);
    this.configForm.get('desc').setValue(response.desc);
    this.configForm.get('long_desc').setValue(response.long_desc);
    this.configForm.get('default').setValue(response.default);
    this.configForm.get('daemon_default').setValue(response.daemon_default);
    this.configForm.get('services').setValue(response.services);

    if (this.response.value) {
      this.response.value.forEach((value) => {
        // Check value type. If it's a boolean value we need to convert it because otherwise we
        // would use the string representation. That would cause issues for e.g. checkboxes.
        let sectionValue = null;
        if (value.value === 'true') {
          sectionValue = true;
        } else if (value.value === 'false') {
          sectionValue = false;
        } else {
          sectionValue = value.value;
        }
        this.configForm
          .get('values')
          .get(value.section)
          .setValue(sectionValue);
      });
    }

    this.availSections.forEach((section) => {
      this.configForm
        .get('values')
        .get(section)
        .setValidators(validators);
    });

    this.type = response.type;
  }

  createRequest(): ConfigFormCreateRequestModel {
    const value = [];

    this.availSections.forEach((section) => {
      const sectionValue = this.configForm.getValue(section);
      value.push({ section: section, value: sectionValue });
    });

    const request = new ConfigFormCreateRequestModel();
    request.name = this.configForm.getValue('name');
    request.value = value;
    return request;
  }

  createAction() {
    const request = this.createRequest();
    this.configService.create(request).subscribe(
      () => {
        this.notificationService.show(
          NotificationType.success,
          'Config option ' + request.name + ' has been updated.',
          'Update config option'
        );
        this.router.navigate(['/configuration']);
      },
      () => {
        this.configForm.setErrors({ cdSubmitButton: true });
      }
    );
  }

  submit() {
    if (this.configForm.pristine) {
      this.router.navigate(['/configuration']); // in nothing is changed you can click save?
    }

    this.createAction();
  }
}
