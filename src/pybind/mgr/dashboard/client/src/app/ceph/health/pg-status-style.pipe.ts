import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pgStatusStyle'
})
export class PgStatusStylePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return null;
  }

}
