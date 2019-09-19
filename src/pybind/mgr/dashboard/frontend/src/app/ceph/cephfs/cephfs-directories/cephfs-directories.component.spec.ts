import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import * as _ from 'lodash';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { of } from 'rxjs';

import { configureTestBed, i18nProviders } from '../../../../testing/unit-test-helper';
import { CephfsService } from '../../../shared/api/cephfs.service';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import {
  CephfsDir,
  CephfsQuotas,
  CephfsSnapshot
} from '../../../shared/models/cephfs-directory-models';
import { CdDatePipe } from '../../../shared/pipes/cd-date.pipe';
import { SharedModule } from '../../../shared/shared.module';
import { CephfsDirectoriesComponent } from './cephfs-directories.component';
import { TableComponent } from '../../../shared/datatable/table/table.component';

describe('CephfsDirectoriesComponent', () => {
  let component: CephfsDirectoriesComponent;
  let fixture: ComponentFixture<CephfsDirectoriesComponent>;
  let lsDirSpy;
  let originalDate;

  const dayInMs = 3600 * 24 * 1000;

  // The object contains functions that return a specific mock
  const mock = {
    quotas: (max_bytes, max_files): CephfsQuotas => ({ max_bytes, max_files }),
    snapshots: (dirPath, howMany): CephfsSnapshot[] => {
      const name = 'someSnapshot';
      const snapshots = [];
      for (let i = 0; i < howMany; i++) {
        const path = `${dirPath}/.snap/${name}${i}`;
        const created = new Date(+new Date() - dayInMs * howMany * (howMany - i)).toString();
        snapshots.push({ name, path, created });
      }
      return snapshots;
    },
    dir: (path, name, modifier): CephfsDir => {
      const dirPath = `${path === '/' ? '' : path}/${name}`;
      return {
        name,
        path: dirPath,
        parent: path,
        quotas: mock.quotas(1024 * modifier, 10 * modifier),
        snapshots: mock.snapshots(path, modifier)
      };
    },
    levelDirs: (id, path = ''): CephfsDir[] => {
      if (path.includes('two')) {
        // 'two' has no sub directories
        return [];
      }
      return [
        mock.dir(path, 'one' + id, 1),
        mock.dir(path, 'two' + id, 2),
        mock.dir(path, 'three' + id, 3)
      ];
    },
    lsDir: (id, path = '') => { // will return 2 levels deep
      let mockData = mock.levelDirs(id, path);
      const paths = mockData.map((dir) => dir.path)
      paths.forEach(pathL2 => {
        mockData = mockData.concat(mock.levelDirs(id, pathL2))
      })
      return of(mockData);
    },
    date: (arg) => (arg ? new originalDate(arg) : new Date('2022-02-22T00:00:00'))
  };

  const updateId = (id: number) => {
    component.id = id;
    component.ngOnChanges();
    component.updateDirList();
  };

  configureTestBed({
    imports: [HttpClientTestingModule, TabsModule.forRoot(), SharedModule],
    declarations: [CephfsDirectoriesComponent],
    providers: [i18nProviders]
  });

  beforeEach(() => {
    originalDate = Date;
    spyOn(global, 'Date').and.callFake(mock.date);

    lsDirSpy = spyOn(TestBed.get(CephfsService), 'lsDir').and.callFake(mock.lsDir);

    fixture = TestBed.createComponent(CephfsDirectoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls lsDir only if an id exits', () => {
    component.ngOnChanges();
    expect(lsDirSpy).not.toHaveBeenCalled();
    updateId(1);
    expect(component.pathList).toEqual([
      '/',
      '/one1', // new -> 3 directories
      '/two1', // new -> 0 directories
      '/three1' // new -> 3 directories
    ]);
    updateId(2);
    expect(component.pathList).toEqual([
      '/',
      '/one2', // new -> 3 directories
      '/two2', // new -> 0 directories
      '/three2' // new -> 3 directories
    ]);
  });

  describe('listing sub directories', () => {
    let table: TableComponent;
    let selection: CdTableSelection;

    const findDir = (path: string) => _.find(component.dirs, (dir) => dir.path === path);

    const selectDir = (path: string) => {
      selection.selected = [findDir(path)];
      table.onSelect();
    };

    const expectTreeStatus = (path, status) => expect(findDir(path).treeStatus).toBe(status);

    const expectTriggerTreeStatus = (path, beforeTriggerStatus, afterTriggerStatus) => {
      expectTreeStatus(path, beforeTriggerStatus);
      component.onTreeAction({ row: findDir(path) });
      expectTreeStatus(path, afterTriggerStatus);
    };

    beforeEach(() => {
      updateId(1);
      table = fixture.debugElement.query(By.directive(TableComponent)).componentInstance;
      selection = table.selection;
    });

    it('should extend the list by subdirectories on first call', () => {
      expect(lsDirSpy).toHaveBeenCalledTimes(4);
      expect(component.pathList).toEqual([
        '/',
        '/one1', // new -> 3 directories
        '/two1', // new -> 0 directories
        '/three1' // new -> 3 directories
      ]);
      component.pathList.forEach((path) => expect(lsDirSpy).toHaveBeenCalledWith(1, path));
      expect(component.dirs.length).toBe(9);
    });

    it('should extend the list by subdirectories on selection and omit already called path', () => {
      selectDir('/one1');
      expect(lsDirSpy).toHaveBeenCalledTimes(7);
      expect(component.pathList).toEqual([
        '/',
        '/one1', // Call got omitted
        '/two1',
        '/three1',
        '/one1/one1', // new -> 3 directories
        '/one1/two1', // new -> 0 directories
        '/one1/three1' // new -> 3 directories
      ]);
      expect(component.dirs.length).toBe(15);
    });

    it('should reload all paths on update', () => {
      selectDir('/three1');
      expect(lsDirSpy).toHaveBeenCalledTimes(7);
      const old_fetched = component.justFetched;
      expect(old_fetched).toBe(component.justFetched);

      component.updateDirList();
      expect(lsDirSpy).toHaveBeenCalledTimes(14);
      expect(old_fetched).not.toBe(component.justFetched);
      expect(old_fetched).toEqual(component.justFetched);
    });

    it('should set the right tree status for the current level', () => {
      expect(findDir('/two1').treeStatus).toBe('disabled');
      expect(findDir('/one1').treeStatus).toBe('collapsed');
      expect(findDir('/one1/one1').treeStatus).toBe('disabled');
      expect(findDir('/one1/two1').treeStatus).toBe('disabled');
    });

    it('should update the tree status for the subdirectories of the selected directory', () => {
      selectDir('/one1'); // Updates subdirectories
      expect(findDir('/one1/one1').treeStatus).toBe('collapsed');
      expect(findDir('/one1/two1').treeStatus).toBe('disabled');
    });

    it('should update subdirectories on tree action', () => {
      expectTriggerTreeStatus('/one1', 'collapsed', 'expanded');
      expect(lsDirSpy).toHaveBeenCalledTimes(7);
    });

    it('should tree actions should can be triggered', () => {
      expectTriggerTreeStatus('/one1', 'collapsed', 'expanded');
      expectTriggerTreeStatus('/one1', 'expanded', 'collapsed');
      expectTriggerTreeStatus('/two1', 'disabled', 'disabled');
    });
  });

  describe('display quotas', () => {
    it('shows nothing if no quotas were set', () => {
      expect(component.displayQuotas(mock.quotas(0, 0))).toBe('');
    });

    it('shows only one value if not both are set', () => {
      expect(component.displayQuotas(mock.quotas(1, 0))).toBe('Max size 1 B');
      expect(component.displayQuotas(mock.quotas(0, 1))).toBe('Max files 1');
    });

    it('uses binary dimensions on max bytes', () => {
      expect(component.displayQuotas(mock.quotas(1024, 0))).toBe('Max size 1 KiB');
      expect(component.displayQuotas(mock.quotas(1024 * 1500, 0))).toBe('Max size 1.5 MiB');
    });

    it('shows both quotas if in use', () => {
      expect(component.displayQuotas(mock.quotas(1024, 30000))).toBe(
        'Max size 1 KiB, Max files 30000'
      );
    });
  });

  describe('display snapshots', () => {
    let datePipe: CdDatePipe;

    const displayDate = (lastSnap: CephfsSnapshot, timeDiff: string) => {
      // In order to not run into timezone conflicts
      const pipedLastSnapDate = datePipe.transform(+new Date(lastSnap.created));
      return `${pipedLastSnapDate} (${timeDiff} ago)`;
    };

    const expectSnapshotsToDisplay = (snapshotsLength: number) => {
      const snapBase = mock.snapshots('/42', snapshotsLength);
      const lastSnap = snapBase[snapshotsLength - 1];
      const snapshots = _.shuffle(snapBase);
      expect(component.displaySnapshots(snapshots)).toBe(
        displayDate(lastSnap, snapshotsLength + 'd')
      );
    };

    beforeEach(() => {
      datePipe = TestBed.get(CdDatePipe);
    });

    it('shows nothing if snapshot no was taken', () => {
      expect(component.displaySnapshots([])).toBe('');
    });

    it('shows time of and duration since the last snapshot', () => {
      expectSnapshotsToDisplay(10);
      expectSnapshotsToDisplay(5);
      expectSnapshotsToDisplay(1);
    });
  });
});
