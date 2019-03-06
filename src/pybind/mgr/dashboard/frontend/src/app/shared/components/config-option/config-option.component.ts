import { Component, Input, OnInit } from '@angular/core';
import { FormControl, NgForm } from '@angular/forms';

import * as _ from 'lodash';

import { ConfigurationService } from '../../api/configuration.service';
import { CdFormGroup } from '../../forms/cd-form-group';
import { ConfigOptionTypes } from './config-option.types';

@Component({
  selector: 'cd-config-option',
  templateUrl: './config-option.component.html',
  styleUrls: ['./config-option.component.scss']
})
export class ConfigOptionComponent implements OnInit {
  @Input()
  optionNames: Array<string> = [];
  @Input()
  optionsForm: CdFormGroup = new CdFormGroup({});
  @Input()
  optionsFormDir: NgForm = new NgForm([], []);
  @Input()
  optionsFormGroupName = '';

  options: Array<any> = [];
  optionsFormGroup: CdFormGroup = new CdFormGroup({});

  constructor(private configService: ConfigurationService) {}

  private static optionNameToText(optionName: string): string {
    const sections = ['mon', 'mgr', 'osd', 'mds', 'client'];
    return optionName
      .split('_')
      .filter((c, index) => index !== 0 || !sections.includes(c))
      .map((c) => c.charAt(0).toUpperCase() + c.substring(1))
      .join(' ');
  }

  ngOnInit() {
    this.createForm();
    this.loadStoredData();
  }

  private createForm() {
    this.optionsForm.addControl(this.optionsFormGroupName, this.optionsFormGroup);
    this.optionNames.forEach((optionName) => {
      this.optionsFormGroup.addControl(optionName, new FormControl(null));
    });
  }

  getStep(type: string, value: any): number | undefined {
    return ConfigOptionTypes.getTypeStep(type, value);
  }

  private loadStoredData() {
    this.configService.filter(this.optionNames).subscribe((data: any) => {
      data.forEach((configOption) => {
        // Set general information and value
        configOption.text = ConfigOptionComponent.optionNameToText(configOption.name);
        configOption.value = _.find(configOption.value, (p) => {
          return p.section === 'osd'; // TODO: Can handle any other section
        });
        if (configOption.value) {
          this.optionsForm.get(configOption.name).setValue(configOption.value.value);
        }

        // Set type information
        configOption.additionalTypeInfo = ConfigOptionTypes.getType(configOption.type);

        // Set validators
        const typeValidators = ConfigOptionTypes.getTypeValidators(configOption);
        if (typeValidators) {
          configOption.patternHelpText = typeValidators.patternHelpText;
          if ('max' in typeValidators && typeValidators.max !== '') {
            configOption.maxValue = typeValidators.max;
          }
          if ('min' in typeValidators && typeValidators.min !== '') {
            configOption.minValue = typeValidators.min;
          }
          this.optionsForm.get(configOption.name).setValidators(typeValidators.validators);
        }

        this.options.push(configOption);
      });
    });
  }

  saveValues() {
    const options = {};
    this.optionNames.forEach((optionName) => {
      const optionValue = this.optionsForm.getValue(optionName);
      if (optionValue) {
        options[optionName] = {
          section: 'osd', // TODO: Can handle any other section
          value: optionValue
        };
      }
    });

    return this.configService.bulkCreate({ options: options });
  }
}
