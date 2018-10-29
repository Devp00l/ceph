import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { TreeModule } from 'ng2-tree';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { configureTestBed } from '../../../../testing/unit-test-helper';
import { DashboardService } from '../../../shared/api/dashboard.service';
import { SharedModule } from '../../../shared/shared.module';
import { CrushmapComponent } from './crushmap.component';

describe('CrushmapComponent', () => {
  let component: CrushmapComponent;
  let fixture: ComponentFixture<CrushmapComponent>;
  let debugElement: DebugElement;
  configureTestBed({
    imports: [HttpClientTestingModule, TreeModule, TabsModule.forRoot(), SharedModule],
    declarations: [CrushmapComponent],
    providers: [DashboardService]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CrushmapComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display right title', () => {
    fixture.detectChanges();
    const span = debugElement.nativeElement.querySelector('span');
    expect(span.textContent).toContain(component.panelTitle);
  });

  it('should display "No nodes!" if ceph tree nodes is empty array', () => {
    const dashboardService = debugElement.injector.get(DashboardService);
    const osd_map = { tree: {} };
    const data = { osd_map };
    const getHealthSpy = spyOn(dashboardService, 'getHealth');
    getHealthSpy.and.returnValue(of(data));
    fixture.detectChanges();

    expect(getHealthSpy).toHaveBeenCalled();
    expect(component.tree.value).toEqual('No nodes!');
  });

  it('should has correct tree data structure after transform the metadata', () => {
    const dashboardService = debugElement.injector.get(DashboardService);
    const osd_map = {
      tree: {
        nodes: [
          { children: [-1], type: 'root', name: 'Root', id: 1 },
          { children: [-2], type: 'host', name: 'Host', id: -1 },
          { status: 'up', type: 'osd', name: 'Osd', id: -2 }
        ]
      }
    };
    const data = { osd_map };
    spyOn(dashboardService, 'getHealth').and.returnValue(of(data));
    fixture.detectChanges();

    expect(component.tree.children[0].children[0].value).toBe('Osd (osd)--up');
  });
});
