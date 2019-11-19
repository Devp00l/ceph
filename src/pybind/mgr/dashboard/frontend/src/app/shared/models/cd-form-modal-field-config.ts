import { ValidatorFn } from '@angular/forms';

export class CdFormModalFieldConfig {
  name: string;
  // 'binary' will use cdDimlessBinary directive on input element
  type: 'number' | 'text' | 'binary';
  label?: string;
  required?: boolean;
  value?: any;
  errors?: { [errorName: string]: string };
  validators: ValidatorFn[];
}
