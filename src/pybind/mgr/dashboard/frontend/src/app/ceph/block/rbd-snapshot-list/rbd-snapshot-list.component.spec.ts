import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ToastModule } from 'ng2-toastr';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap';
import { throwError as observableThrowError, of } from 'rxjs';

import { configureTestBed } from '../../../../testing/unit-test-helper';
import { ApiModule } from '../../../shared/api/api.module';
import { RbdService } from '../../../shared/api/rbd.service';
import { ComponentsModule } from '../../../shared/components/components.module';
import { DataTableModule } from '../../../shared/datatable/datatable.module';
import { Permissions } from '../../../shared/models/permissions';
import { PipesModule } from '../../../shared/pipes/pipes.module';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { ServicesModule } from '../../../shared/services/services.module';
import { RbdSnapshotListComponent } from './rbd-snapshot-list.component';

describe('RbdSnapshotListComponent', () => {
  let component: RbdSnapshotListComponent;
  let fixture: ComponentFixture<RbdSnapshotListComponent>;

  const fakeAuthStorageService = {
    isLoggedIn: () => {
      return true;
    },
    getPermissions: () => {
      return new Permissions({ 'rbd-image': ['read', 'update', 'create', 'delete'] });
    }
  };

  configureTestBed({
    declarations: [RbdSnapshotListComponent],
    imports: [
      DataTableModule,
      ComponentsModule,
      ModalModule.forRoot(),
      ToastModule.forRoot(),
      ServicesModule,
      ApiModule,
      HttpClientTestingModule,
      RouterTestingModule,
      PipesModule
    ],
    providers: [{ provide: AuthStorageService, useValue: fakeAuthStorageService }]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RbdSnapshotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('api delete request', () => {
    let called;
    let rbdService: RbdService;
    let notificationService: NotificationService;
    let authStorageService: AuthStorageService;

    beforeEach(() => {
      called = false;
      rbdService = new RbdService(null);
      notificationService = new NotificationService(null, null);
      authStorageService = new AuthStorageService();
      authStorageService.set('user', { 'rbd-image': ['create', 'read', 'update', 'delete'] });
      component = new RbdSnapshotListComponent(
        authStorageService,
        null,
        null,
        null,
        rbdService,
        null,
        notificationService
      );
      spyOn(rbdService, 'deleteSnapshot').and.returnValue(observableThrowError({ status: 500 }));
      spyOn(notificationService, 'notifyTask').and.stub();
      component.modalRef = new BsModalRef();
      component.modalRef.content = {
        stopLoadingSpinner: () => (called = true)
      };
    });

    it('should call stopLoadingSpinner if the request fails', <any>fakeAsync(() => {
      expect(called).toBe(false);
      component._asyncTask('deleteSnapshot', 'rbd/snap/delete', 'someName');
      tick(500);
      expect(called).toBe(true);
    }));
  });

  describe('snapshot modal dialog', () => {
    let modalRef;
    let newName:string;
    beforeEach(() => {
      component.poolName = 'pool01';
      component.rbdName = 'image01';
      newName = '';
      modalRef = {
        content: {
          onSubmit: of([]),
          setSnapName: (name) => newName=name
        }
      };
      spyOn(TestBed.get(BsModalService), 'show').and.callFake(() => modalRef);
      spyOn(component as any, 'openSnapshotModal').and.callThrough();
    });

    it('should display old snapshot name', () => {
      // set the selection first
      // component.openCreateSnapshotModal();
      // sth
    });

    it('should display suggested snapshot name', () => {
      component.openCreateSnapshotModal();
      expect(component['openSnapshotModal']).toHaveBeenCalledWith('rbd/snap/create');
      expect(newName.match(/image01-20[0-9]{6}T[0-9]{6}Z$/)).toBeTruthy();
    });
  });
});
