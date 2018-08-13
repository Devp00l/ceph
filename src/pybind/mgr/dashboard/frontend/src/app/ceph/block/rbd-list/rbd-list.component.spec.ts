import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ToastModule } from 'ng2-toastr';
import {
  AlertModule,
  BsDropdownModule,
  ModalModule,
  TabsModule,
  TooltipModule
} from 'ngx-bootstrap';

import { configureTestBed } from '../../../../testing/unit-test-helper';
import { RbdService } from '../../../shared/api/rbd.service';
import { ComponentsModule } from '../../../shared/components/components.module';
import { ViewCacheStatus } from '../../../shared/enum/view-cache-status.enum';
import { SummaryService } from '../../../shared/services/summary.service';
import { TaskListService } from '../../../shared/services/task-list.service';
import { SharedModule } from '../../../shared/shared.module';
import { RbdDetailsComponent } from '../rbd-details/rbd-details.component';
import { RbdSnapshotListComponent } from '../rbd-snapshot-list/rbd-snapshot-list.component';
import { RbdListComponent } from './rbd-list.component';

describe('RbdListComponent', () => {
  let fixture: ComponentFixture<RbdListComponent>;
  let component: RbdListComponent;
  let summaryService: SummaryService;
  let rbdService: RbdService;

  let data: any;

  const raiseError = () => {
    summaryService['summaryDataSource'].error(undefined);
  };

  const refresh = () => {
    summaryService['summaryDataSource'].next(data);
  };

  configureTestBed(
    {
      imports: [
        SharedModule,
        BsDropdownModule.forRoot(),
        TabsModule.forRoot(),
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        ToastModule.forRoot(),
        AlertModule.forRoot(),
        ComponentsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [RbdListComponent, RbdDetailsComponent, RbdSnapshotListComponent],
      providers: [SummaryService, TaskListService, RbdService]
    },
    true
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RbdListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('after ngOnInit', () => {
    beforeEach(() => {
      summaryService = TestBed.get(SummaryService);
      rbdService = TestBed.get(RbdService);

      data = undefined;
      fixture.detectChanges();
      spyOn(rbdService, 'list').and.callThrough();
    });

    it('should load images on init', () => {
      data = {};
      refresh();
      expect(rbdService.list).toHaveBeenCalled();
    });

    it('should not load images on init because no data', () => {
      refresh();
      expect(rbdService.list).not.toHaveBeenCalled();
    });

    it('should call error function on init when summary service fails', () => {
      spyOn(component.table, 'reset');
      raiseError();
      expect(component.table.reset).toHaveBeenCalled();
      expect(component.viewCacheStatusList).toEqual([{ status: ViewCacheStatus.ValueException }]);
    });
  });
});
