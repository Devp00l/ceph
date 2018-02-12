import {Injectable, TemplateRef} from '@angular/core';
import {TableColumn} from '@swimlane/ngx-datatable';

@Injectable()
export class TableTemplatesService {
  columns: TableColumn[];
  cellTemplates: {
    [key: string]: TemplateRef<any>
  } = {};
  setColumns: Function;

  constructor() { }

  overwriteSetColumns (setColumns: Function, oldThis: any) {
    this.setColumns = () => {
      this.columns = setColumns.call(oldThis);
      console.log(this.columns);
    };
    this.setColumns();
  }

  updateColumns(templates) {
    this.cellTemplates = templates;
    this.setColumns();
    console.log(this.columns);
  }
}
