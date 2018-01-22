import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'underscore';

@Pipe({
  name: 'pgStatus'
})
export class PgStatusPipe implements PipeTransform {
  transform(pg_status: any, args?: any): any {
    const strings = [];
    _.each(pg_status, function(count, state) {
      strings.push(count + ' ' + state);
    });

    return strings.join(', ');
  }
}
