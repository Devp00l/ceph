import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { NgBootstrapFormValidationModule } from 'ng-bootstrap-form-validation';
import { TreeComponent, TREE_ACTIONS, TreeModule } from 'angular-tree-component';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import * as _ from 'lodash';

import {
  configureTestBed,
  i18nProviders,
  modalServiceShow,
  PermissionHelper
} from '../../../../testing/unit-test-helper';
import { CephfsService } from '../../../shared/api/cephfs.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';
import { NotificationType } from '../../../shared/enum/notification-type.enum';
import { CdValidators } from '../../../shared/forms/cd-validators';
import { CdTableAction } from '../../../shared/models/cd-table-action';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import {
  CephfsDir,
  CephfsQuotas,
  CephfsSnapshot
} from '../../../shared/models/cephfs-directory-models';
import { NotificationService } from '../../../shared/services/notification.service';
import { SharedModule } from '../../../shared/shared.module';
import { CephfsDirectoriesComponent } from './cephfs-directories.component';

describe('CephfsDirectoriesComponent', () => {
  let component: CephfsDirectoriesComponent;
  let fixture: ComponentFixture<CephfsDirectoriesComponent>;
  let cephfsService: CephfsService;
  let lsDirSpy;
  let modalShowSpy;
  let notificationShowSpy;
  let minValidator;
  let maxValidator;
  let minBinaryValidator;
  let maxBinaryValidator;
  let originalDate;
  let modal;

  // Get's private attributes or functions
  const get = {
    nodeIds: (): { [path: string]: CephfsDir } => component['nodeIds'],
    dirs: (): CephfsDir[] => component['dirs'],
    requestedPaths: (): string[] => component['requestedPaths']
  };

  // Object contains mock data that will be reset before each test.
  let mockData: {
    nodes: any;
    parent: any;
    createdSnaps: CephfsSnapshot[] | any[];
    deletedSnaps: CephfsSnapshot[] | any[];
    updatedQuotas: { [path: string]: CephfsQuotas };
    createdDirs: CephfsDir[];
  };

  // Object contains mock functions
  const mockLib = {
    quotas: (max_bytes: number, max_files: number): CephfsQuotas => ({ max_bytes, max_files }),
    snapshots: (dirPath: string, howMany: number): CephfsSnapshot[] => {
      const name = 'someSnapshot';
      const snapshots = [];
      for (let i = 0; i < howMany; i++) {
        const snapName = `${name}${i + 1}`;
        const path = `${dirPath}/.snap/${snapName}`;
        const created = new Date(
          +new Date() - 3600 * 24 * 1000 * howMany * (howMany - i)
        ).toString();
        snapshots.push({ name: snapName, path, created });
      }
      return snapshots;
    },
    dir: (parentPath: string, name: string, modifier: number): CephfsDir => {
      const dirPath = `${parentPath === '/' ? '' : parentPath}/${name}`;
      let snapshots = mockLib.snapshots(parentPath, modifier);
      const extraSnapshots = mockData.createdSnaps.filter((s) => s.path === dirPath);
      if (extraSnapshots.length > 0) {
        snapshots = snapshots.concat(extraSnapshots);
      }
      const deletedSnapshots = mockData.deletedSnaps
        .filter((s) => s.path === dirPath)
        .map((s) => s.name);
      if (deletedSnapshots.length > 0) {
        snapshots = snapshots.filter((s) => !deletedSnapshots.includes(s.name));
      }
      return {
        name,
        path: dirPath,
        parent: parentPath,
        quotas: Object.assign(
          mockLib.quotas(1024 * modifier, 10 * modifier),
          mockData.updatedQuotas[dirPath] || {}
        ),
        snapshots: snapshots
      };
    },
    // Only used inside other mocks
    lsSingleDir: (path = ''): CephfsDir[] => {
      const customDirs = mockData.createdDirs.filter((d) => d.parent === path);
      const isCustomDir = mockData.createdDirs.some(d => d.path === path)
      if (isCustomDir || path.includes('b')) {
        // 'b' has no sub directories
        return customDirs;
      }
      return customDirs.concat([
        // Directories are not sorted!
        mockLib.dir(path, 'c', 3),
        mockLib.dir(path, 'a', 1),
        mockLib.dir(path, 'b', 2)
      ]);
    },
    lsDir: (_id: number, path = '') => {
      // will return 2 levels deep
      let data = mockLib.lsSingleDir(path);
      const paths = data.map((dir) => dir.path);
      paths.forEach((pathL2) => {
        data = data.concat(mockLib.lsSingleDir(pathL2));
      });
      return of(data);
    },
    mkSnapshot: (_id, path, name) => {
      mockData.createdSnaps.push({
        name,
        path,
        created: new Date().toString()
      });
      return of(name);
    },
    rmSnapshot: (_id, path, name) => {
      mockData.deletedSnaps.push({
        name,
        path,
        created: new Date().toString()
      });
      return of(name);
    },
    updateQuota: (_id, path, updated: CephfsQuotas) => {
      mockData.updatedQuotas[path] = Object.assign(mockData.updatedQuotas[path] || {}, updated);
      return of('Response');
    },
    modalShow: (comp, init) => {
      modal = modalServiceShow(comp, init);
      return modal.ref;
    },
    date: (arg) => (arg ? new originalDate(arg) : new Date('2022-02-22T00:00:00')),
    getNodeById: (path: string) => {
      return mockLib.useNode(path);
    },
    // Only used inside other mocks to mock "tree.expand" of every node
    expand: (path: string) => {
      mockLib.updateNodes(component.updateDirectory(path));
    },
    updateNodes: fakeAsync((n: any[] | Promise<any[]>) => {
      const saveMocks = (nodes) => {
        mockData.nodes = mockData.nodes.concat(nodes);
      };
      if (_.isArray(n)) {
        saveMocks(n);
      } else {
        // It's a promise
        n.then((nodes) => saveMocks(nodes));
      }
      tick();
    }),
    getNodeEvent: (path: string) => {
      const tree = mockData.nodes.find((n) => n.id === path);
      if (mockData.parent) {
        tree.parent = mockData.parent;
      } else {
        const dir = get.nodeIds()[path];
        const parentNode = mockData.nodes.find((n) => n.id === dir.parent);
        tree.parent = parentNode;
      }
      return { node: tree };
    },
    changeId: (id: number) => {
      component.id = id;
      component.ngOnChanges();
      mockData.nodes = component.tree.concat(component.tree[0].children);
    },
    selectNode: (path: string) => {
      component['selectAndShowNode'](undefined, mockLib.useNode(path), undefined);
    },
    // Creates TreeNode with parents until root
    useNode: (path: string) => {
      const isRootDir = path.split('/').length === 2;
      return {
        id: path,
        parent: isRootDir ? { id: '/' } : mockLib.useNode(get.nodeIds()[path].parent)
      };
    },
    treeActions: {
      toggleActive: (_a, node, _b) => mockLib.updateNodes(component.treeOptions.getChildren(node))
    },
    mkDir: (path: string, name: string, maxFiles: number, maxBytes: number) => {
      const dir = mockLib.dir(path, name, 3);
      dir.quotas.max_bytes = maxBytes * 1024;
      dir.quotas.max_files = maxFiles;
      mockData.createdDirs.push(dir);
      // Below is needed for quota tests only where 4 dirs are mocked
      get.nodeIds()[dir.path] = dir;
      mockData.nodes.push({ id: dir.path });
    },
    createSnapshotThroughModal: (name: string) => {
      component.createSnapshot();
      modal.component.onSubmitForm({ name });
    },
    deleteSnapshotsThroughModal: (snapshots: CephfsSnapshot[]) => {
      component.snapshot.selection.selected = snapshots;
      component.deleteSnapshotModal();
      modal.component.callSubmitAction();
    },
    updateQuotaThroughModal: (attribute: string, value: number) => {
      component.quota.selection.selected = component.settings.filter(
        (q) => q.quotaKey === attribute
      );
      component.updateQuotaModal();
      modal.component.onSubmitForm({ [attribute]: value });
    },
    unsetQuotaThroughModal: (attribute: string) => {
      component.quota.selection.selected = component.settings.filter(
        (q) => q.quotaKey === attribute
      );
      component.unsetQuotaModal();
      modal.component.onSubmit();
    },
    setFourQuotaDirs: (quotas: number[][]) => {
      expect(quotas.length).toBe(4); // Make sure this function is used correctly
      let path = '';
      quotas.forEach((quota, index) => {
        index += 1;
        mockLib.mkDir(path === '' ? '/' : path, index.toString(), quota[0], quota[1]);
        path += '/' + index;
      });
      mockData.parent = {
        value: '3',
        id: '/1/2/3',
        parent: {
          value: '2',
          id: '/1/2',
          parent: {
            value: '1',
            id: '/1',
            parent: { value: '/', id: '/' }
          }
        }
      };
      mockLib.selectNode('/1/2/3/4');
    }
  };

  // Expects that are used frequently
  const assert = {
    dirLength: (n: number) => expect(get.dirs().length).toBe(n),
    nodeLength: (n: number) => expect(mockData.nodes.length).toBe(n),
    lsDirCalledTimes: (n: number) => expect(lsDirSpy).toHaveBeenCalledTimes(n),
    lsDirHasBeenCalledWith: (id: number, paths: string[]) => {
      paths.forEach((path) => expect(lsDirSpy).toHaveBeenCalledWith(id, path));
      expect(lsDirSpy).toHaveBeenCalledTimes(paths.length);
    },
    requestedPaths: (expected: string[]) => expect(get.requestedPaths()).toEqual(expected),
    snapshotsByName: (snaps: string[]) =>
      expect(component.selectedDir.snapshots.map((s) => s.name)).toEqual(snaps),
    dirQuotas: (bytes: number, files: number) => {
      expect(component.selectedDir.quotas).toEqual({ max_bytes: bytes, max_files: files });
    },
    noQuota: (key: 'bytes' | 'files') => {
      assert.quotaRow(key, '', 0, '');
    },
    quotaIsNotInherited: (key: 'bytes' | 'files', shownValue, nextMaximum) => {
      const dir = component.selectedDir;
      const path = dir.path;
      assert.quotaRow(key, shownValue, nextMaximum, path);
    },
    quotaIsInherited: (key: 'bytes' | 'files', shownValue, path) => {
      const isBytes = key === 'bytes';
      const nextMaximum = get.nodeIds()[path].quotas[isBytes ? 'max_bytes' : 'max_files'];
      assert.quotaRow(key, shownValue, nextMaximum, path);
    },
    quotaRow: (
      key: 'bytes' | 'files',
      shownValue: number | string,
      nextTreeMaximum: number,
      originPath: string
    ) => {
      const isBytes = key === 'bytes';
      expect(component.settings[isBytes ? 1 : 0]).toEqual({
        row: {
          name: `Max ${isBytes ? 'size' : key}`,
          value: shownValue,
          originPath
        },
        quotaKey: `max_${key}`,
        dirValue: expect.any(Number),
        nextTreeMaximum: {
          value: nextTreeMaximum,
          path: expect.any(String)
        }
      });
    },
    quotaUnsetModalTexts: (titleText, message, notificationMsg) => {
      expect(modalShowSpy).toHaveBeenCalledWith(ConfirmationModalComponent, {
        initialState: expect.objectContaining({
          titleText,
          description: message,
          buttonText: 'Unset'
        })
      });
      expect(notificationShowSpy).toHaveBeenCalledWith(NotificationType.success, notificationMsg);
    },
    quotaUpdateModalTexts: (titleText, message, notificationMsg) => {
      expect(modalShowSpy).toHaveBeenCalledWith(FormModalComponent, {
        initialState: expect.objectContaining({
          titleText,
          message,
          submitButtonText: 'Save'
        })
      });
      expect(notificationShowSpy).toHaveBeenCalledWith(NotificationType.success, notificationMsg);
    },
    quotaUpdateModalField: (
      type: string,
      label: string,
      key: string,
      value: number,
      max: number,
      errors?: { [key: string]: string }
    ) => {
      expect(modalShowSpy).toHaveBeenCalledWith(FormModalComponent, {
        initialState: expect.objectContaining({
          fields: [
            {
              type,
              label,
              errors,
              name: key,
              value,
              validators: expect.anything(),
              required: true
            }
          ]
        })
      });
      if (type === 'binary') {
        expect(minBinaryValidator).toHaveBeenCalledWith(0);
        expect(maxBinaryValidator).toHaveBeenCalledWith(max);
      } else {
        expect(minValidator).toHaveBeenCalledWith(0);
        expect(maxValidator).toHaveBeenCalledWith(max);
      }
    }
  };

  configureTestBed({
    imports: [
      HttpClientTestingModule,
      SharedModule,
      RouterTestingModule,
      TreeModule.forRoot(),
      NgBootstrapFormValidationModule.forRoot(),
      ToastrModule.forRoot(),
      ModalModule.forRoot()
    ],
    declarations: [CephfsDirectoriesComponent],
    providers: [i18nProviders, BsModalRef]
  });

  beforeEach(() => {
    mockData = {
      nodes: undefined,
      parent: undefined,
      createdSnaps: [],
      deletedSnaps: [],
      createdDirs: [],
      updatedQuotas: {}
    };
    originalDate = Date;
    spyOn(global, 'Date').and.callFake(mockLib.date);

    cephfsService = TestBed.get(CephfsService);
    lsDirSpy = spyOn(cephfsService, 'lsDir').and.callFake(mockLib.lsDir);
    spyOn(cephfsService, 'mkSnapshot').and.callFake(mockLib.mkSnapshot);
    spyOn(cephfsService, 'rmSnapshot').and.callFake(mockLib.rmSnapshot);
    spyOn(cephfsService, 'updateQuota').and.callFake(mockLib.updateQuota);

    modalShowSpy = spyOn(TestBed.get(BsModalService), 'show').and.callFake(mockLib.modalShow);
    notificationShowSpy = spyOn(TestBed.get(NotificationService), 'show').and.stub();

    fixture = TestBed.createComponent(CephfsDirectoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(TREE_ACTIONS, 'TOGGLE_ACTIVE').and.callFake(mockLib.treeActions.toggleActive);

    component.treeComponent = { treeModel: { getNodeById: mockLib.getNodeById } } as TreeComponent;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('mock self test', () => {
    it('tests snapshots mock', () => {
      expect(mockLib.snapshots('/a', 1).map((s) => ({ name: s.name, path: s.path }))).toEqual([
        {
          name: 'someSnapshot1',
          path: '/a/.snap/someSnapshot1'
        }
      ]);
      expect(mockLib.snapshots('/a/b', 3).map((s) => ({ name: s.name, path: s.path }))).toEqual([
        {
          name: 'someSnapshot1',
          path: '/a/b/.snap/someSnapshot1'
        },
        {
          name: 'someSnapshot2',
          path: '/a/b/.snap/someSnapshot2'
        },
        {
          name: 'someSnapshot3',
          path: '/a/b/.snap/someSnapshot3'
        }
      ]);
    });

    it('tests dir mock', () => {
      const path = '/a/b/c';
      mockData.createdSnaps = [{ path, name: 's1' }, { path, name: 's2' }];
      mockData.deletedSnaps = [{ path, name: 'someSnapshot2' }, { path, name: 's2' }];
      const dir = mockLib.dir('/a/b', 'c', 2);
      expect(dir.path).toBe('/a/b/c');
      expect(dir.parent).toBe('/a/b');
      expect(dir.quotas).toEqual({ max_bytes: 2048, max_files: 20 });
      expect(dir.snapshots.map((s) => s.name)).toEqual(['someSnapshot1', 's1']);
    });

    it('tests lsdir mock', () => {
      let dirs: CephfsDir[] = [];
      mockLib.lsDir(2, '/a').subscribe((x) => (dirs = x));
      expect(dirs.map((d) => d.path)).toEqual([
        '/a/c',
        '/a/a',
        '/a/b',
        '/a/c/c',
        '/a/c/a',
        '/a/c/b',
        '/a/a/c',
        '/a/a/a',
        '/a/a/b'
      ]);
    });

    describe('test quota update mock', () => {
      const PATH = '/a';
      const ID = 2;

      const updateQuota = (quotas: CephfsQuotas) => mockLib.updateQuota(ID, PATH, quotas);

      const expectMockUpdate = (max_bytes?: number, max_files?: number) =>
        expect(mockData.updatedQuotas[PATH]).toEqual({
          max_bytes,
          max_files
        });

      const expectLsUpdate = (max_bytes?: number, max_files?: number) => {
        let dir: CephfsDir;
        mockLib.lsDir(ID, '/').subscribe((dirs) => (dir = dirs.find((d) => d.path === PATH)));
        expect(dir.quotas).toEqual({
          max_bytes,
          max_files
        });
      };

      it('tests to set quotas', () => {
        expectLsUpdate(1024, 10);

        updateQuota({ max_bytes: 512 });
        expectMockUpdate(512);
        expectLsUpdate(512, 10);

        updateQuota({ max_files: 100 });
        expectMockUpdate(512, 100);
        expectLsUpdate(512, 100);
      });

      it('tests to unset quotas', () => {
        updateQuota({ max_files: 0 });
        expectMockUpdate(undefined, 0);
        expectLsUpdate(1024, 0);

        updateQuota({ max_bytes: 0 });
        expectMockUpdate(0, 0);
        expectLsUpdate(0, 0);
      });
    });
  });

  it('calls lsDir only if an id exits', () => {
    component.ngOnChanges();
    assert.lsDirCalledTimes(0);

    mockLib.changeId(1);
    assert.lsDirCalledTimes(1);
    expect(lsDirSpy).toHaveBeenCalledWith(1, '/');

    mockLib.changeId(2);
    assert.lsDirCalledTimes(2);
    expect(lsDirSpy).toHaveBeenCalledWith(2, '/');
  });

  describe('listing sub directories', () => {
    beforeEach(() => {
      mockLib.changeId(1);
      /**
       * Tree looks like this:
       * v /
       *   > a
       *   * b
       *   > c
       * */
    });

    it('expands first level', () => {
      // Tree will only show '*' if nor 'loadChildren' or 'children' are defined
      expect(
        mockData.nodes.map((node) => ({ [node.id]: node.hasChildren || Boolean(node.children) }))
      ).toEqual([{ '/': true }, { '/a': true }, { '/b': false }, { '/c': true }]);
    });

    it('resets all dynamic content on id change', () => {
      mockLib.selectNode('/a');
      /**
       * Tree looks like this:
       * v /
       *   v a <- Selected
       *     > a
       *     * b
       *     > c
       *   * b
       *   > c
       * */
      assert.requestedPaths(['/', '/a']);
      assert.dirLength(15);
      assert.nodeLength(7);
      expect(component.selectedDir).toBeDefined();

      mockLib.changeId(undefined);
      assert.dirLength(0);
      assert.requestedPaths([]);
      expect(component.selectedDir).not.toBeDefined();
    });

    it('should select a node and show the directory contents', () => {
      mockLib.selectNode('/a');
      const dir = get.dirs().find((d) => d.path === '/a');
      expect(component.selectedDir).toEqual(dir);
      assert.quotaIsNotInherited('files', 10, 0);
      assert.quotaIsNotInherited('bytes', '1 KiB', 0);
    });

    it('should extend the list by subdirectories when expanding and omit already called path', () => {
      mockLib.selectNode('/a');
      mockLib.selectNode('/a/c');
      /**
       * Tree looks like this:
       * v /
       *   v a
       *     > a
       *     * b
       *     v c <- Selected
       *       > a
       *       * b
       *       > c
       *   * b
       *   > c
       * */
      assert.lsDirCalledTimes(3);
      assert.requestedPaths(['/', '/a', '/a/c']);
      assert.dirLength(21);
      assert.nodeLength(10);
    });

    it('should select parent by path', () => {
      mockLib.selectNode('/a');
      mockLib.selectNode('/a/c');
      mockLib.selectNode('/a/c/a');
      component.selectOrigin('/a');
      expect(component.selectedDir.path).toBe('/a');
    });

    it('should omit call for directories that have no sub directories', () => {
      mockLib.selectNode('/b');
      /**
       * Tree looks like this:
       * v /
       *   > a
       *   * b <- Selected
       *   > c
       * */
      assert.lsDirCalledTimes(1);
      assert.requestedPaths(['/']);
      assert.nodeLength(4);
    });

    describe('used quotas', () => {
      it('should use no quota if none is set', () => {
        mockLib.setFourQuotaDirs([[0, 0], [0, 0], [0, 0], [0, 0]]);
        assert.noQuota('files');
        assert.noQuota('bytes');
        assert.dirQuotas(0, 0);
      });

      it('should use quota from upper parents', () => {
        mockLib.setFourQuotaDirs([[100, 0], [0, 8], [0, 0], [0, 0]]);
        assert.quotaIsInherited('files', 100, '/1');
        assert.quotaIsInherited('bytes', '8 KiB', '/1/2');
        assert.dirQuotas(0, 0);
      });

      it('should use quota from the parent with the lowest value (deep inheritance)', () => {
        mockLib.setFourQuotaDirs([[200, 1], [100, 4], [400, 3], [300, 2]]);
        assert.quotaIsInherited('files', 100, '/1/2');
        assert.quotaIsInherited('bytes', '1 KiB', '/1');
        assert.dirQuotas(2048, 300);
      });

      it('should use current value', () => {
        mockLib.setFourQuotaDirs([[200, 2], [300, 4], [400, 3], [100, 1]]);
        assert.quotaIsNotInherited('files', 100, 200);
        assert.quotaIsNotInherited('bytes', '1 KiB', 2048);
        assert.dirQuotas(1024, 100);
      });
    });
  });

  describe('snapshots', () => {
    beforeEach(() => {
      mockLib.changeId(1);
      mockLib.selectNode('/a');
    });

    it('should create a snapshot', () => {
      mockLib.createSnapshotThroughModal('newSnap');
      expect(cephfsService.mkSnapshot).toHaveBeenCalledWith(1, '/a', 'newSnap');
      assert.snapshotsByName(['someSnapshot1', 'newSnap']);
    });

    it('should delete a snapshot', () => {
      mockLib.createSnapshotThroughModal('deleteMe');
      mockLib.deleteSnapshotsThroughModal([component.selectedDir.snapshots[1]]);
      assert.snapshotsByName(['someSnapshot1']);
    });

    it('should delete all snapshots', () => {
      mockLib.createSnapshotThroughModal('deleteAll');
      mockLib.deleteSnapshotsThroughModal(component.selectedDir.snapshots);
      assert.snapshotsByName([]);
    });
  });

  it('should test all snapshot table actions combinations', () => {
    const permissionHelper: PermissionHelper = new PermissionHelper(component.permission);
    const tableActions = permissionHelper.setPermissionsAndGetActions(
      component.snapshot.tableActions
    );

    expect(tableActions).toEqual({
      'create,update,delete': {
        actions: ['Create', 'Delete'],
        primary: { multiple: 'Delete', executing: 'Delete', single: 'Delete', no: 'Create' }
      },
      'create,update': {
        actions: ['Create'],
        primary: { multiple: 'Create', executing: 'Create', single: 'Create', no: 'Create' }
      },
      'create,delete': {
        actions: ['Create', 'Delete'],
        primary: { multiple: 'Delete', executing: 'Delete', single: 'Delete', no: 'Create' }
      },
      create: {
        actions: ['Create'],
        primary: { multiple: 'Create', executing: 'Create', single: 'Create', no: 'Create' }
      },
      'update,delete': {
        actions: ['Delete'],
        primary: { multiple: 'Delete', executing: 'Delete', single: 'Delete', no: 'Delete' }
      },
      update: {
        actions: [],
        primary: { multiple: '', executing: '', single: '', no: '' }
      },
      delete: {
        actions: ['Delete'],
        primary: { multiple: 'Delete', executing: 'Delete', single: 'Delete', no: 'Delete' }
      },
      'no-permissions': {
        actions: [],
        primary: { multiple: '', executing: '', single: '', no: '' }
      }
    });
  });

  describe('quotas', () => {
    beforeEach(() => {
      // Spies
      minValidator = spyOn(Validators, 'min').and.callThrough();
      maxValidator = spyOn(Validators, 'max').and.callThrough();
      minBinaryValidator = spyOn(CdValidators, 'binaryMin').and.callThrough();
      maxBinaryValidator = spyOn(CdValidators, 'binaryMax').and.callThrough();
      // Select /a/c/b
      mockLib.changeId(1);
      mockLib.selectNode('/a');
      mockLib.selectNode('/a/c');
      mockLib.selectNode('/a/c/b');
      // Quotas after selection
      assert.quotaIsInherited('files', 10, '/a');
      assert.quotaIsInherited('bytes', '1 KiB', '/a');
      assert.dirQuotas(2048, 20);
    });

    describe('update modal', () => {
      describe('max_files', () => {
        beforeEach(() => {
          mockLib.updateQuotaThroughModal('max_files', 5);
        });

        it('should update max_files correctly', () => {
          expect(cephfsService.updateQuota).toHaveBeenCalledWith(1, '/a/c/b', { max_files: 5 });
          assert.quotaIsNotInherited('files', 5, 10);
        });

        it('uses the correct form field', () => {
          assert.quotaUpdateModalField('number', 'Max files', 'max_files', 20, 10, {
            min: 'Value has to be at least 0 or more',
            max: 'Value has to be at most 10 or less'
          });
        });

        it('shows the right texts', () => {
          assert.quotaUpdateModalTexts(
            "Update CephFS files quota for '/a/c/b'",
            "The inherited files quota 10 from '/a' is the maximum value to be used.",
            "Updated CephFS files quota for '/a/c/b'"
          );
        });
      });

      describe('max_bytes', () => {
        beforeEach(() => {
          mockLib.updateQuotaThroughModal('max_bytes', 512);
        });

        it('should update max_files correctly', () => {
          expect(cephfsService.updateQuota).toHaveBeenCalledWith(1, '/a/c/b', { max_bytes: 512 });
          assert.quotaIsNotInherited('bytes', '512 B', 1024);
        });

        it('uses the correct form field', () => {
          mockLib.updateQuotaThroughModal('max_bytes', 512);
          assert.quotaUpdateModalField('binary', 'Max size', 'max_bytes', 2048, 1024);
        });

        it('shows the right texts', () => {
          assert.quotaUpdateModalTexts(
            "Update CephFS size quota for '/a/c/b'",
            "The inherited size quota 1 KiB from '/a' is the maximum value to be used.",
            "Updated CephFS size quota for '/a/c/b'"
          );
        });
      });

      describe('action behaviour', () => {
        it('opens with next maximum as maximum if directory holds the current maximum', () => {
          mockLib.updateQuotaThroughModal('max_bytes', 512);
          mockLib.updateQuotaThroughModal('max_bytes', 888);
          assert.quotaUpdateModalField('binary', 'Max size', 'max_bytes', 512, 1024);
        });

        it("uses 'Set' action instead of 'Update' if the quota is not set (0)", () => {
          mockLib.updateQuotaThroughModal('max_bytes', 0);
          mockLib.updateQuotaThroughModal('max_bytes', 200);
          assert.quotaUpdateModalTexts(
            "Set CephFS size quota for '/a/c/b'",
            "The inherited size quota 1 KiB from '/a' is the maximum value to be used.",
            "Set CephFS size quota for '/a/c/b'"
          );
        });
      });
    });

    describe('unset modal', () => {
      describe('max_files', () => {
        beforeEach(() => {
          mockLib.updateQuotaThroughModal('max_files', 5); // Sets usable quota
          mockLib.unsetQuotaThroughModal('max_files');
        });

        it('should unset max_files correctly', () => {
          expect(cephfsService.updateQuota).toHaveBeenCalledWith(1, '/a/c/b', { max_files: 0 });
          assert.dirQuotas(2048, 0);
        });

        it('shows the right texts', () => {
          assert.quotaUnsetModalTexts(
            "Unset CephFS files quota for '/a/c/b'",
            "Unset files quota 5 from '/a/c/b' in order to inherit files quota 10 from '/a'.",
            "Unset CephFS files quota for '/a/c/b'"
          );
        });
      });

      describe('max_bytes', () => {
        beforeEach(() => {
          mockLib.updateQuotaThroughModal('max_bytes', 512); // Sets usable quota
          mockLib.unsetQuotaThroughModal('max_bytes');
        });

        it('should unset max_files correctly', () => {
          expect(cephfsService.updateQuota).toHaveBeenCalledWith(1, '/a/c/b', { max_bytes: 0 });
          assert.dirQuotas(0, 20);
        });

        it('shows the right texts', () => {
          assert.quotaUnsetModalTexts(
            "Unset CephFS size quota for '/a/c/b'",
            "Unset size quota 512 B from '/a/c/b' in order to inherit size quota 1 KiB from '/a'.",
            "Unset CephFS size quota for '/a/c/b'"
          );
        });
      });

      describe('action behaviour', () => {
        it('uses different Text if no quota is inherited', () => {
          mockLib.selectNode('/a');
          mockLib.unsetQuotaThroughModal('max_bytes');
          assert.quotaUnsetModalTexts(
            "Unset CephFS size quota for '/a'",
            "Unset size quota 1 KiB from '/a' in order to have no quota on the directory.",
            "Unset CephFS size quota for '/a'"
          );
        });

        it('uses different Text if quota is already inherited', () => {
          mockLib.unsetQuotaThroughModal('max_bytes');
          assert.quotaUnsetModalTexts(
            "Unset CephFS size quota for '/a/c/b'",
            "Unset size quota 2 KiB from '/a/c/b' which isn't used because of the inheritance " +
              "of size quota 1 KiB from '/a'.",
            "Unset CephFS size quota for '/a/c/b'"
          );
        });
      });
    });
  });

  describe('table actions', () => {
    let actions: CdTableAction[];

    const empty = (): CdTableSelection => new CdTableSelection();

    const select = (value: number): CdTableSelection => {
      const selection = new CdTableSelection();
      selection.selected = [{ dirValue: value }];
      return selection;
    };

    beforeEach(() => {
      actions = component.quota.tableActions;
    });

    it("shows 'Set' for empty and not set quotas", () => {
      const isSetVisible = actions[0].visible;
      expect(isSetVisible(empty())).toBe(true);
      expect(isSetVisible(select(0))).toBe(true);
      expect(isSetVisible(select(1))).toBe(false);
    });

    it("shows 'Update' for set quotas only", () => {
      const isUpdateVisible = actions[1].visible;
      expect(isUpdateVisible(empty())).toBeFalsy();
      expect(isUpdateVisible(select(0))).toBe(false);
      expect(isUpdateVisible(select(1))).toBe(true);
    });

    it("only enables 'Unset' for set quotas only", () => {
      const isUnsetDisabled = actions[2].disable;
      expect(isUnsetDisabled(empty())).toBe(true);
      expect(isUnsetDisabled(select(0))).toBe(true);
      expect(isUnsetDisabled(select(1))).toBe(false);
    });

    it('should test all quota table actions permission combinations', () => {
      const permissionHelper: PermissionHelper = new PermissionHelper(component.permission);
      const tableActions = permissionHelper.setPermissionsAndGetActions(
        component.quota.tableActions
      );

      expect(tableActions).toEqual({
        'create,update,delete': {
          actions: ['Set', 'Update', 'Unset'],
          primary: { multiple: 'Set', executing: 'Set', single: 'Set', no: 'Set' }
        },
        'create,update': {
          actions: ['Set', 'Update', 'Unset'],
          primary: { multiple: 'Set', executing: 'Set', single: 'Set', no: 'Set' }
        },
        'create,delete': {
          actions: [],
          primary: { multiple: '', executing: '', single: '', no: '' }
        },
        create: {
          actions: [],
          primary: { multiple: '', executing: '', single: '', no: '' }
        },
        'update,delete': {
          actions: ['Set', 'Update', 'Unset'],
          primary: { multiple: 'Set', executing: 'Set', single: 'Set', no: 'Set' }
        },
        update: {
          actions: ['Set', 'Update', 'Unset'],
          primary: { multiple: 'Set', executing: 'Set', single: 'Set', no: 'Set' }
        },
        delete: {
          actions: [],
          primary: { multiple: '', executing: '', single: '', no: '' }
        },
        'no-permissions': {
          actions: [],
          primary: { multiple: '', executing: '', single: '', no: '' }
        }
      });
    });
  });

  describe('reload all', () => {
    const calledPaths = ['/', '/a', '/a/c', '/a/c/a'];
    const dirsByPath = () => get.dirs().map((d) => d.path);

    beforeEach(() => {
      mockLib.changeId(1);
      mockLib.selectNode('/a');
      mockLib.selectNode('/a/c');
      mockLib.selectNode('/a/c/a');
      mockLib.selectNode('/a/c/a/b');
    });

    it('should store all requested paths', () => {
      expect(get.requestedPaths()).toEqual(calledPaths);
      assert.lsDirHasBeenCalledWith(1, calledPaths);
    });

    it('should reload all requested paths + the current selected dir', () => {
      assert.lsDirHasBeenCalledWith(1, calledPaths);
      lsDirSpy.calls.reset();
      component.refreshAllDirectories();
      assert.lsDirHasBeenCalledWith(1, ['/', '/a', '/a/c', '/a/c/a', '/a/c/a/b']);
    });

    it('should reload all requested paths if not selected anything', () => {
      lsDirSpy.calls.reset();
      mockLib.changeId(2);
      assert.lsDirHasBeenCalledWith(2, ['/']);
      lsDirSpy.calls.reset();
      component.refreshAllDirectories();
      assert.lsDirHasBeenCalledWith(2, ['/']);
    });

    it('should add new directories if some exist', () => {
      const dirsBeforeRefresh = dirsByPath();
      mockLib.mkDir('/a/c', 'has_dir_now', 0, 0);
      mockLib.mkDir('/a/c/a/b', 'has_dir_now_too', 0, 0);
      component.refreshAllDirectories();
      const dirsAfterRefresh = dirsByPath();
      console.log(dirsAfterRefresh, dirsBeforeRefresh)
      expect(dirsAfterRefresh.length - dirsBeforeRefresh.length).toBe(2);
    });

    it('should remove directories that do not exist anymore', () => {
      mockLib.mkDir('/a/c', 'will_be_removed_shortly', 0, 0);
      component.refreshAllDirectories();
      const dirsBeforeRefresh = dirsByPath();
      mockData.createdDirs = [] // Resets all custom added dirs
      component.refreshAllDirectories();
      const dirsAfterRefresh = dirsByPath();
      expect(dirsAfterRefresh.length - dirsBeforeRefresh.length).toBe(-1);
    });
  });
});
