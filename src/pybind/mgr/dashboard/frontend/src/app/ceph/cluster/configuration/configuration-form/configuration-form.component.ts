import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfigurationService } from '../../../../shared/api/configuration.service';
import { CdFormGroup } from '../../../../shared/forms/cd-form-group';
import { ConfigFormModel } from './configuration-form.model';

@Component({
  selector: 'cd-configuration-form',
  templateUrl: './configuration-form.component.html',
  styleUrls: ['./configuration-form.component.scss']
})
export class ConfigurationFormComponent implements OnInit {
  configForm: CdFormGroup;
  response: ConfigFormModel;
  type: string;
  minValue: number;
  maxValue: number;
  availSections = ['global', 'mon', 'mgr', 'osd', 'mds', 'client'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigurationService
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
  }

  ngOnInit() {
    this.route.params.subscribe((params: { name: string }) => {
      const configName = params.name;
      this.configService.get(configName).subscribe((resp: ConfigFormModel) => {
        this.setResponse(resp);
      });
    });
  }

  getValidators(configOption: any) {
    const validators = [];
    const numberTypes = ['uint64_t', 'int64_t', 'size_t', 'double', 'secs'];

    if (numberTypes.includes(configOption.type)) {
      if (configOption.max && configOption.max !== '') {
        this.maxValue = configOption.max;
        validators.push(Validators.max(configOption.max));
      }

      if (configOption.min && configOption.min !== '') {
        this.minValue = configOption.min;
        validators.push(Validators.min(configOption.min));
      }
    }

    if (configOption.type === 'double') {
      validators.push(Validators.pattern('-?[0-9]+(.[0-9]+)?'));
    }

    if (configOption.type === 'entity_addr_t') {
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
      validators.push(Validators.pattern(ipv4Ipv6Rgx));
    }

    if (configOption.type === 'uuid_d') {
      validators.push(
        Validators.pattern('[a-z0-9]{8}\\-[a-z0-9]{4}\\-[a-z0-9]{4}\\-[a-z0-9]{4}\\-[a-z0-9]{12}')
      );
    }

    return validators;
  }

  setResponse(response: ConfigFormModel) {
    this.response = response;
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
}
