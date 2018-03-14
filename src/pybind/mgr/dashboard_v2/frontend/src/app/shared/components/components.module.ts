import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ChartsModule } from 'ng2-charts/ng2-charts';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ModalModule } from 'ngx-bootstrap/modal';

import { DeletionModalComponent } from './deletion-modal/deletion-modal.component';
import { ModalComponent } from './modal/modal.component';
import { SparklineComponent } from './sparkline/sparkline.component';
import { SubmitButtonComponent } from './submit-button/submit-button.component';
import { ViewCacheComponent } from './view-cache/view-cache.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AlertModule.forRoot(),
    ChartsModule,
    ModalModule.forRoot()
  ],
  declarations: [
    ViewCacheComponent,
    SparklineComponent,
    ModalComponent,
    SubmitButtonComponent,
    DeletionModalComponent
  ],
  providers: [],
  exports: [
    ViewCacheComponent,
    SparklineComponent,
    ModalComponent,
    DeletionModalComponent,
    SubmitButtonComponent
  ]
})
export class ComponentsModule { }
