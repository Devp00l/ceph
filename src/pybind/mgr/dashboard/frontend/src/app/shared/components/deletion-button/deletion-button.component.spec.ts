import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ModalModule } from 'ngx-bootstrap';

import { ModalComponent } from '../modal/modal.component';
import { SubmitButtonComponent } from '../submit-button/submit-button.component';
import { DeletionButtonComponent } from './deletion-button.component';

describe('DeletionButtonComponent', () => {
  let component: DeletionButtonComponent;
  let fixture: ComponentFixture<DeletionButtonComponent>;
  let openModalBtn: DebugElement;
  const metaType = 'Type';
  const pattern = 'instance-name-of-type';
  const deleteLabel = 'Delete Type';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeletionButtonComponent, ModalComponent, SubmitButtonComponent],
      imports: [ModalModule.forRoot(), ReactiveFormsModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeletionButtonComponent);
    component = fixture.componentInstance;
    component.metaType = metaType;
    component.pattern = pattern;
    openModalBtn = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should button initiated a button the the delete label', () => {
    expect(openModalBtn.nativeElement.textContent.match(/\w+/g).join(' ')).toBe(deleteLabel);
  });
});
