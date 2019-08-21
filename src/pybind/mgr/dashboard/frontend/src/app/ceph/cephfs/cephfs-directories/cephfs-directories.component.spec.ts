import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import * as _ from 'lodash';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { of } from 'rxjs';

import { configureTestBed, i18nProviders } from '../../../../testing/unit-test-helper';
import { CephfsService } from '../../../shared/api/cephfs.service';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import { CephfsQuotas, CephfsSnapshot } from '../../../shared/models/cephfs-directory-models';
import { CdDatePipe } from '../../../shared/pipes/cd-date.pipe';
import { SharedModule } from '../../../shared/shared.module';
import { CephfsDirectoriesComponent } from './cephfs-directories.component';

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
    dir: (path, name, modifier) => {
      const dirPath = `${path}/${name}`;
      return {
        name,
        path: dirPath,
        quota: mock.quotas(1024 * modifier, 10 * modifier),
        snapshots: mock.snapshots(path, modifier)
      };
    },
    lsDir: (_id, path = '') => {
      if (path.includes('two')) {
        // 'two' has no sub directories
        return of([]);
      }
      const mockData = [
        mock.dir(path, 'one', 1),
        mock.dir(path, 'two', 2),
        mock.dir(path, 'three', 3)
      ];
      return of(mockData);
    },
    date: (arg) => (arg ? new originalDate(arg) : new Date('2022-02-22T00:00:00'))
  };

  const updateId = (id: number) => {
    component.id = id;
    component.ngOnChanges();
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
    expect(lsDirSpy).toHaveBeenCalledWith(1, undefined);
    updateId(2);
    expect(lsDirSpy).toHaveBeenCalledWith(2, undefined);
  });

  describe('listing sub directories', () => {
    let innerComponent: CephfsDirectoriesComponent;

    const selection = new CdTableSelection();

    const selectDir = (index: number) => {
      selection.selected = [component.dirs[index]];
      selection.update();
      component.updateSelection(selection);

      fixture.detectChanges();
      innerComponent = fixture.debugElement.query(By.directive(CephfsDirectoriesComponent))
        .componentInstance;
    };

    beforeEach(() => {
      updateId(1);
      selectDir(0);
    });

    it('sets a custom header for each selection', () => {
      expect(component.getTabHeading()).toBe('Directories in /one');
      selectDir(1);
      expect(component.getTabHeading()).toBe('Directories in /two');
    });

    it('called lsDir with the selected directory path', () => {
      expect(lsDirSpy).toHaveBeenCalledWith(1, '/one');
      selectDir(1);
      expect(lsDirSpy).toHaveBeenCalledWith(1, '/two');
    });

    it('has different directories in the sub directories tab', () => {
      expect(component.dirs).not.toEqual(innerComponent.dirs);
      expect(innerComponent.dirs.length).toBe(3);
      const oldDirs = innerComponent.dirs;
      selectDir(1);
      expect(oldDirs).not.toEqual(innerComponent.dirs);
      expect(innerComponent.dirs.length).toBe(0);
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
