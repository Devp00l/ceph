import { Component, NgModule, TemplateRef, ViewChild } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

import { ModalComponent } from '../modal/modal.component';
import { SubmitButtonComponent } from '../submit-button/submit-button.component';
import { DeletionModalComponent } from './deletion-modal.component';

@NgModule({
  entryComponents: [DeletionModalComponent]
})
export class MockModule {}

@Component({
  template: `
    <button type="button"
        class="btn btn-sm btn-primary"
        (click)="openCtrlDriven()">
      <i class="fa fa-fw fa-trash"></i>Deletion Ctrl-Test
    </button>
    <ng-template #ctrlDescription>
      The spinner is handled by the controller if you have use the modal as ViewChild in order to
      use it's functions to stop the spinner or close the dialog.
    </ng-template>

    <button type="button"
            class="btn btn-sm btn-primary"
            (click)="openModalDriven()">
      <i class="fa fa-fw fa-trash"></i>Deletion Modal-Test
    </button>
    <ng-template #modalDescription>
      The spinner is handled by the modal if your given deletion function returns a Observable.
    </ng-template>
  `
})
class MockComponent {
  @ViewChild('ctrlDescription') ctrlDescription: TemplateRef<any>;
  @ViewChild('modalDescription') modalDescription: TemplateRef<any>;
  someData = [1, 2, 3, 4, 5];
  finished: number[];
  ctrlRef: BsModalRef;
  modalRef: BsModalRef;

  constructor(private modalService: BsModalService) {}

  openModal(metaType, pattern, description: TemplateRef<any>) {
    const ref: BsModalRef = this.modalService.show(DeletionModalComponent);
    ref.content.metaType = metaType;
    ref.content.pattern = pattern;
    ref.content.description = description;
    ref.content.modalRef = ref;
    return ref;
  }

  openCtrlDriven() {
    this.ctrlRef = this.openModal('Controller delete handling', 'ctrl-test', this.ctrlDescription);
    this.ctrlRef.content.deletionMethod = this.fakeDeleteController.bind(this);
  }

  openModalDriven() {
    this.modalRef = this.openModal('Modal delete handling', 'modal-test', this.modalDescription);
    this.modalRef.content.deletionObserver = this.fakeDelete();
  }

  finish() {
    this.finished = [6, 7, 8, 9];
  }

  fakeDelete() {
    return (): Observable<any> => {
      return new Observable((observer: Subscriber<any>) => {
        Observable.timer(100).subscribe(() => {
          observer.next(this.finish());
          observer.complete();
        });
      });
    };
  }

  fakeDeleteController() {
    Observable.timer(100).subscribe(() => {
      this.finish();
      this.ctrlRef.hide();
    });
  }
}

describe('DeletionModalComponent', () => {
  let mockComponent: MockComponent;
  let component: DeletionModalComponent;
  let fixture: ComponentFixture<MockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MockComponent, DeletionModalComponent, ModalComponent,
        SubmitButtonComponent],
      imports: [ModalModule.forRoot(), ReactiveFormsModule, MockModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MockComponent);
    mockComponent = fixture.componentInstance;
    mockComponent.openCtrlDriven();
    mockComponent.openModalDriven();
    component = mockComponent.ctrlRef.content;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test if the ctrl driven mock is set correctly through mock component', () => {
    expect(component.metaType).toBe('Controller delete handling');
    expect(component.pattern).toBe('ctrl-test');
    expect(component.description).toBeTruthy();
    expect(component.modalRef).toBeTruthy();
    expect(component.deletionMethod).toBeTruthy();
    expect(component.deletionObserver).not.toBeTruthy();
  });

  it('should test if the modal driven mock is set correctly through mock component', () => {
    component = mockComponent.modalRef.content;
    expect(component.metaType).toBe('Modal delete handling');
    expect(component.pattern).toBe('modal-test');
    expect(component.description).toBeTruthy();
    expect(component.modalRef).toBeTruthy();
    expect(component.deletionObserver).toBeTruthy();
    expect(component.deletionMethod).not.toBeTruthy();
  });

  describe('component functions', () => {
    const changeValue = (value) => {
      component.confirmation.setValue(value);
      component.confirmation.markAsDirty();
      component.confirmation.updateValueAndValidity();
    };

    it('should test hideModal', () => {
      expect(component.modalRef).toBeTruthy();
      expect(component.hideModal).toBeTruthy();
      spyOn(component.modalRef, 'hide').and.callThrough();
      expect(component.modalRef.hide).not.toHaveBeenCalled();
      component.hideModal();
      expect(component.modalRef.hide).toHaveBeenCalled();
    });

    describe('invalid control', () => {
      const testInvalidControl = (submitted: boolean, error: string, expected: boolean) => {
        expect(component.invalidControl(submitted, error)).toBe(expected);
      };

      beforeEach(() => {
        component.deletionForm.reset();
      });

      it('should test empty values', () => {
        expect(component.invalidControl).toBeTruthy();
        component.deletionForm.reset();
        testInvalidControl(false, undefined, false);
        testInvalidControl(true, 'required', true);
        component.deletionForm.reset();
        changeValue('let-me-pass');
        changeValue('');
        testInvalidControl(true, 'required', true);
      });

      it('should test pattern', () => {
        changeValue('let-me-pass');
        testInvalidControl(false, 'pattern', true);
        changeValue('ctrl-test');
        testInvalidControl(false, undefined, false);
        testInvalidControl(true, undefined, false);
      });
    });

    describe('deletion call', () => {
      beforeEach(() => {
        spyOn(component, 'stopLoadingSpinner').and.callThrough();
        spyOn(component, 'hideModal').and.callThrough();
      });

      describe('Controller driven', () => {
        beforeEach(() => {
          spyOn(component, 'deletionMethod').and.callThrough();
          spyOn(mockComponent.ctrlRef, 'hide').and.callThrough();
        });

        it('should test fake deletion that closes modal', <any>fakeAsync(() => {
          // Before deletionCall
          expect(component.deletionMethod).not.toHaveBeenCalled();
          // During deletionCall
          component.deletionCall();
          expect(component.stopLoadingSpinner).not.toHaveBeenCalled();
          expect(component.hideModal).not.toHaveBeenCalled();
          expect(mockComponent.ctrlRef.hide).not.toHaveBeenCalled();
          expect(component.deletionMethod).toHaveBeenCalled();
          expect(mockComponent.finished).toBe(undefined);
          // After deletionCall
          tick(2000);
          expect(component.hideModal).not.toHaveBeenCalled();
          expect(mockComponent.ctrlRef.hide).toHaveBeenCalled();
          expect(mockComponent.finished).toEqual([6, 7, 8, 9]);
        }));
      });

      describe('Modal driven', () => {
        beforeEach(() => {
          component = mockComponent.modalRef.content;
          spyOn(mockComponent.modalRef, 'hide').and.callThrough();
          spyOn(component, 'stopLoadingSpinner').and.callThrough();
          spyOn(component, 'hideModal').and.callThrough();
          spyOn(mockComponent, 'fakeDelete').and.callThrough();
        });

        it('should delete and close modal', <any>fakeAsync(() => {
          // During deletionCall
          component.deletionCall();
          expect(mockComponent.finished).toBe(undefined);
          expect(component.hideModal).not.toHaveBeenCalled();
          expect(mockComponent.modalRef.hide).not.toHaveBeenCalled();
          // After deletionCall
          tick(2000);
          expect(mockComponent.finished).toEqual([6, 7, 8, 9]);
          expect(mockComponent.modalRef.hide).toHaveBeenCalled();
          expect(component.stopLoadingSpinner).not.toHaveBeenCalled();
          expect(component.hideModal).toHaveBeenCalled();
        }));
      });
    });
  });

});
