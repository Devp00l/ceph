import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'underscore';

@Pipe({
  name: 'serviceList'
})
export class ServiceListPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    const strings = [];
    _.each(value, (server) => {
      strings.push(server.type + '.' + server.id);
    });
    return strings.join(', ');
  }
}
