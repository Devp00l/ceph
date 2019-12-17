import { Component, Input, OnChanges, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';

import { I18n } from '@ngx-translate/i18n-polyfill';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TreeNode, TreeComponent, ITreeOptions, TREE_ACTIONS } from 'angular-tree-component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { CephfsService } from '../../../shared/api/cephfs.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { CriticalConfirmationModalComponent } from '../../../shared/components/critical-confirmation-modal/critical-confirmation-modal.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';
import { ActionLabelsI18n } from '../../../shared/constants/app.constants';
import { Icons } from '../../../shared/enum/icons.enum';
import { NotificationType } from '../../../shared/enum/notification-type.enum';
import { CdValidators } from '../../../shared/forms/cd-validators';
import { CdFormModalFieldConfig } from '../../../shared/models/cd-form-modal-field-config';
import { CdTableAction } from '../../../shared/models/cd-table-action';
import { CdTableColumn } from '../../../shared/models/cd-table-column';
import { CdTableSelection } from '../../../shared/models/cd-table-selection';
import {
  CephfsDir,
  CephfsQuotas,
  CephfsSnapshot
} from '../../../shared/models/cephfs-directory-models';
import { Permission } from '../../../shared/models/permissions';
import { CdDatePipe } from '../../../shared/pipes/cd-date.pipe';
import { DimlessBinaryPipe } from '../../../shared/pipes/dimless-binary.pipe';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';
import { NotificationService } from '../../../shared/services/notification.service';

class QuotaSetting {
  row: {
    // Shows quota that is used for current directory
    name: string;
    value: number | string;
    originPath: string;
  };
  quotaKey: string;
  dirValue: number;
  nextTreeMaximum: {
    value: number;
    path: string;
  };
}

@Component({
  selector: 'cd-cephfs-directories',
  templateUrl: './cephfs-directories.component.html',
  styleUrls: ['./cephfs-directories.component.scss']
})
export class CephfsDirectoriesComponent implements OnInit, OnChanges {
  @ViewChild(TreeComponent, { static: false })
  treeComponent: TreeComponent;
  @ViewChild('origin', { static: true })
  originTmpl: TemplateRef<any>;

  @Input()
  id: number;

  private modalRef: BsModalRef;
  private dirs: CephfsDir[];
  private nodeIds: { [path: string]: CephfsDir };
  private requestedPaths: string[];

  icons = Icons;
  loadingIndicator = false;
  treeOptions: ITreeOptions = {
    getChildren: (node: TreeNode) => {
      return this.updateDirectory(node.id);
    },
    actionMapping: {
      mouse: {
        click: this.selectAndShowNode.bind(this),
        expanderClick: this.selectAndShowNode.bind(this)
      }
    }
  };

  getSelectedNode(): TreeNode {
    return this.selectedDir
      ? this.treeComponent.treeModel.getNodeById(this.selectedDir.path)
      : undefined;
  }

  private selectAndShowNode(tree, node, $event) {
    TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
    this.selectNode(node);
  }

  permission: Permission;
  selectedDir: CephfsDir;
  settings: QuotaSetting[];
  quota: {
    columns: CdTableColumn[];
    selection: CdTableSelection;
    tableActions: CdTableAction[];
    updateSelection: Function;
  };
  snapshot: {
    columns: CdTableColumn[];
    selection: CdTableSelection;
    tableActions: CdTableAction[];
    updateSelection: Function;
  };
  tree: any[];

  constructor(
    private authStorageService: AuthStorageService,
    private modalService: BsModalService,
    private cephfsService: CephfsService,
    private cdDatePipe: CdDatePipe,
    private i18n: I18n,
    private actionLabels: ActionLabelsI18n,
    private notificationService: NotificationService,
    private dimlessBinaryPipe: DimlessBinaryPipe
  ) {}

  ngOnInit() {
    this.permission = this.authStorageService.getPermissions().cephfs;
    this.quota = {
      columns: [
        {
          prop: 'row.name',
          name: this.i18n('Name'),
          flexGrow: 1
        },
        {
          prop: 'row.value',
          name: this.i18n('Value'),
          sortable: false,
          flexGrow: 1
        },
        {
          prop: 'row.originPath',
          name: this.i18n('Origin'),
          sortable: false,
          cellTemplate: this.originTmpl,
          flexGrow: 1
        }
      ],
      selection: new CdTableSelection(),
      updateSelection: (selection: CdTableSelection) => {
        this.quota.selection = selection;
      },
      tableActions: [
        {
          name: this.actionLabels.SET,
          icon: Icons.edit,
          permission: 'update',
          visible: (selection) =>
            !selection.hasSelection || (selection.first() && selection.first().dirValue === 0),
          click: () => this.updateQuotaModal()
        },
        {
          name: this.actionLabels.UPDATE,
          icon: Icons.edit,
          permission: 'update',
          visible: (selection) => selection.first() && selection.first().dirValue > 0,
          click: () => this.updateQuotaModal()
        },
        {
          name: this.actionLabels.UNSET,
          icon: Icons.destroy,
          permission: 'update',
          disable: (selection) =>
            !selection.hasSelection || (selection.first() && selection.first().dirValue === 0),
          click: () => this.unsetQuotaModal()
        }
      ]
    };
    this.snapshot = {
      columns: [
        {
          prop: 'name',
          name: this.i18n('Name'),
          flexGrow: 1
        },
        {
          prop: 'path',
          name: this.i18n('Path'),
          isHidden: true,
          flexGrow: 2
        },
        {
          prop: 'created',
          name: this.i18n('Created'),
          flexGrow: 1,
          pipe: this.cdDatePipe
        }
      ],
      selection: new CdTableSelection(),
      updateSelection: (selection: CdTableSelection) => {
        this.snapshot.selection = selection;
      },
      tableActions: [
        {
          name: this.actionLabels.CREATE,
          icon: Icons.add,
          permission: 'create',
          canBePrimary: (selection) => !selection.hasSelection,
          click: () => this.createSnapshot()
        },
        {
          name: this.actionLabels.DELETE,
          icon: Icons.destroy,
          permission: 'delete',
          click: () => this.deleteSnapshotModal(),
          canBePrimary: (selection) => selection.hasSelection,
          disable: (selection) => !selection.hasSelection
        }
      ]
    };
  }

  ngOnChanges() {
    this.selectedDir = undefined;
    this.dirs = [];
    this.requestedPaths = [];
    this.nodeIds = {};
    if (_.isUndefined(this.id)) {
      this.setRootNode([]);
    } else {
      this.firstCall();
    }
  }

  private setRootNode(nodes: any[]) {
    const tree: any = {
      name: '/',
      id: '/',
      isExpanded: true
    };
    if (nodes.length > 0) {
      tree.children = nodes;
    }
    this.tree = [tree];
  }

  private firstCall() {
    const path = '/';
    this.requestedPaths.push(path);
    this.cephfsService.lsDir(this.id, path).subscribe((data) => {
      this.dirs = this.dirs.concat(data);
      this.setRootNode(this.getChildren(path));
    });
  }

  updateDirectory(path: string): any {
    if (
      !this.requestedPaths.includes(path) &&
      (path === '/' || this.getSubDirectories(path).length > 0)
    ) {
      this.requestedPaths.push(path);
      return new Promise((resolve) =>
        this.cephfsService
          .lsDir(this.id, path)
          .subscribe((data) => resolve(this.loadDirectory(data, path)))
      );
    } else {
      return this.getChildren(path);
    }
  }

  private getSubDirectories(path: string, tree: CephfsDir[] = this.dirs): CephfsDir[] {
    return tree.filter((d) => d.parent === path);
  }

  private loadDirectory(data: CephfsDir[], path: string): any {
    if (path !== '/') {
      // As always to levels are loaded all sub-directories of the current called path are
      // already loaded, that's why they are filtered out.
      data = data.filter((dir) => dir.parent !== path);
    }
    this.dirs = this.dirs.concat(data);
    return this.getChildren(path);
  }

  private getChildren(parentPath: string): any[] {
    const subTree = this.getSubTree(parentPath);
    return _.sortBy(this.getSubDirectories(parentPath), 'path').map((dir) =>
      this.createNode(dir, subTree)
    );
  }

  private createNode(dir: CephfsDir, subTree?: CephfsDir[]) {
    this.nodeIds[dir.path] = dir;
    if (!subTree) {
      this.getSubTree(dir.parent);
    }
    return {
      name: dir.name,
      id: dir.path,
      hasChildren: this.getSubDirectories(dir.path, subTree).length > 0
    };
  }

  private getSubTree(path: string): CephfsDir[] {
    return this.dirs.filter((d) => d.parent.startsWith(path));
  }

  private selectNodeByPath(path) {
    this.selectNode(this.treeComponent.treeModel.getNodeById(path));
  }

  private selectNode(node) {
    TREE_ACTIONS.TOGGLE_ACTIVE(undefined, node, undefined);
    if (node.id === '/') {
      return;
    }
    this.setSettings(node);
    this.selectedDir = this.getDirectory(node);
  }

  selectOrigin(path) {
    this.selectNodeByPath(path);
  }

  private setSettings(node: TreeNode) {
    const readable = (value: number, fn?: (number) => number | string): number | string =>
      value ? (fn ? fn(value) : value) : '';

    this.settings = [
      this.getQuota(node, 'max_files', readable),
      this.getQuota(node, 'max_bytes', (value) =>
        readable(value, (v) => this.dimlessBinaryPipe.transform(v))
      )
    ];
  }

  private getQuota(
    tree: TreeNode,
    quotaKey: string,
    valueConvertFn: (number) => number | string
  ): QuotaSetting {
    // Get current maximum
    const currentPath = tree.id;
    tree = this.getOrigin(tree, quotaKey);
    const dir = this.getDirectory(tree);
    const value = dir.quotas[quotaKey];
    // Get next tree maximum
    // => The value that isn't changeable through a change of the current directories quota value
    let nextMaxValue = value;
    let nextMaxPath = dir.path;
    if (tree.id === currentPath) {
      if (tree.parent.id === '/') {
        // The value will never inherit any other value, so it has no maximum.
        nextMaxValue = 0;
      } else {
        const nextMaxDir = this.getDirectory(this.getOrigin(tree.parent, quotaKey));
        nextMaxValue = nextMaxDir.quotas[quotaKey];
        nextMaxPath = nextMaxDir.path;
      }
    }
    return {
      row: {
        name: quotaKey === 'max_bytes' ? this.i18n('Max size') : this.i18n('Max files'),
        value: valueConvertFn(value),
        originPath: value ? dir.path : ''
      },
      quotaKey,
      dirValue: this.nodeIds[currentPath].quotas[quotaKey],
      nextTreeMaximum: {
        value: nextMaxValue,
        path: nextMaxValue ? nextMaxPath : ''
      }
    };
  }

  /**
   * Get the node where the quota limit originates from in the current node
   *
   * Example as it's a recursive method:
   *
   * |  Path + Value | Call depth |       useOrigin?      | Output |
   * |:-------------:|:----------:|:---------------------:|:------:|
   * | /a/b/c/d (15) |     1st    | 2nd (5) < 15 => false |  /a/b  |
   * | /a/b/c (20)   |     2nd    | 3rd (5) < 20 => false |  /a/b  |
   * | /a/b (5)      |     3rd    |  4th (10) < 5 => true |  /a/b  |
   * | /a (10)       |     4th    |       10 => true      |   /a   |
   *
   */
  private getOrigin(tree: TreeNode, quotaSetting: string): TreeNode {
    if (tree.parent && tree.parent.id !== '/') {
      const current = this.getQuotaFromTree(tree, quotaSetting);

      // Get the next used quota and node above the current one (until it hits the root directory)
      const originTree = this.getOrigin(tree.parent, quotaSetting);
      const inherited = this.getQuotaFromTree(originTree, quotaSetting);

      // Select if the current quota is in use or the above
      const useOrigin = current === 0 || (inherited !== 0 && inherited < current);
      return useOrigin ? originTree : tree;
    }
    return tree;
  }

  private getQuotaFromTree(tree: TreeNode, quotaSetting: string): number {
    return this.getDirectory(tree).quotas[quotaSetting];
  }

  private getDirectory(node: TreeNode): CephfsDir {
    const path = node.id as string;
    return this.nodeIds[path];
  }

  updateQuotaModal() {
    const path = this.selectedDir.path;
    const selection: QuotaSetting = this.quota.selection.first();
    const nextMax = selection.nextTreeMaximum;
    const key = selection.quotaKey;
    const value = selection.dirValue;
    this.modalService.show(FormModalComponent, {
      initialState: {
        titleText: this.getModalQuotaTitle(
          value === 0 ? this.actionLabels.SET : this.actionLabels.UPDATE,
          path
        ),
        message: nextMax.value
          ? this.i18n('The inherited {{quotaValue}} is the maximum value to be used.', {
              quotaValue: this.getQuotaValueFromPathMsg(nextMax.value, nextMax.path)
            })
          : undefined,
        fields: [this.getQuotaFormField(selection.row.name, key, value, nextMax.value)],
        submitButtonText: 'Save',
        onSubmit: (values) => this.updateQuota(values)
      }
    });
  }

  private getModalQuotaTitle(action: string, path: string): string {
    return this.i18n("{{action}} CephFS {{quotaName}} quota for '{{path}}'", {
      action,
      quotaName: this.getQuotaName(),
      path
    });
  }

  private getQuotaName(): string {
    return this.isBytesQuotaSelected() ? this.i18n('size') : this.i18n('files');
  }

  private isBytesQuotaSelected(): boolean {
    return this.quota.selection.first().quotaKey === 'max_bytes';
  }

  private getQuotaValueFromPathMsg(value: number, path: string): string {
    return this.i18n("{{quotaName}} quota {{value}} from '{{path}}'", {
      value: this.isBytesQuotaSelected() ? this.dimlessBinaryPipe.transform(value) : value,
      quotaName: this.getQuotaName(),
      path
    });
  }

  private getQuotaFormField(
    label: string,
    name: string,
    value: number,
    maxValue: number
  ): CdFormModalFieldConfig {
    const isBinary = name === 'max_bytes';
    const formValidators = [isBinary ? CdValidators.binaryMin(0) : Validators.min(0)];
    if (maxValue) {
      formValidators.push(isBinary ? CdValidators.binaryMax(maxValue) : Validators.max(maxValue));
    }
    const field: CdFormModalFieldConfig = {
      type: isBinary ? 'binary' : 'number',
      label,
      name,
      value,
      validators: formValidators,
      required: true
    };
    if (!isBinary) {
      field.errors = {
        min: this.i18n(`Value has to be at least {{value}} or more`, { value: 0 }),
        max: this.i18n(`Value has to be at most {{value}} or less`, { value: maxValue })
      };
    }
    return field;
  }

  private updateQuota(values: CephfsQuotas, onSuccess?: Function) {
    const path = this.selectedDir.path;
    const key = this.quota.selection.first().quotaKey;
    const action =
      this.selectedDir.quotas[key] === 0
        ? this.actionLabels.SET
        : values[key] === 0
        ? this.actionLabels.UNSET
        : this.i18n('Updated');
    this.cephfsService.updateQuota(this.id, path, values).subscribe(() => {
      if (onSuccess) {
        onSuccess();
      }
      this.notificationService.show(
        NotificationType.success,
        this.getModalQuotaTitle(action, path)
      );
      this.forceDirRefresh();
    });
  }

  unsetQuotaModal() {
    const path = this.selectedDir.path;
    const selection: QuotaSetting = this.quota.selection.first();
    const key = selection.quotaKey;
    const nextMax = selection.nextTreeMaximum;
    const dirValue = selection.dirValue;

    this.modalRef = this.modalService.show(ConfirmationModalComponent, {
      initialState: {
        titleText: this.getModalQuotaTitle(this.actionLabels.UNSET, path),
        buttonText: this.actionLabels.UNSET,
        description: this.i18n(`{{action}} {{quotaValue}} {{conclusion}}.`, {
          action: this.actionLabels.UNSET,
          quotaValue: this.getQuotaValueFromPathMsg(dirValue, path),
          conclusion:
            nextMax.value > 0
              ? nextMax.value > dirValue
                ? this.i18n('in order to inherit {{quotaValue}}', {
                    quotaValue: this.getQuotaValueFromPathMsg(nextMax.value, nextMax.path)
                  })
                : this.i18n("which isn't used because of the inheritance of {{quotaValue}}", {
                    quotaValue: this.getQuotaValueFromPathMsg(nextMax.value, nextMax.path)
                  })
              : this.i18n('in order to have no quota on the directory')
        }),
        onSubmit: () => this.updateQuota({ [key]: 0 }, () => this.modalRef.hide())
      }
    });
  }

  createSnapshot() {
    // Create a snapshot. Auto-generate a snapshot name by default.
    const path = this.selectedDir.path;
    this.modalService.show(FormModalComponent, {
      initialState: {
        titleText: this.i18n('Create Snapshot'),
        message: this.i18n('Please enter the name of the snapshot.'),
        fields: [
          {
            type: 'text',
            name: 'name',
            value: `${moment().toISOString(true)}`,
            required: true
          }
        ],
        submitButtonText: this.i18n('Create Snapshot'),
        onSubmit: (values) => {
          this.cephfsService.mkSnapshot(this.id, path, values.name).subscribe((name) => {
            this.notificationService.show(
              NotificationType.success,
              this.i18n('Created snapshot "{{name}}" for "{{path}}"', {
                name: name,
                path: path
              })
            );
            this.forceDirRefresh();
          });
        }
      }
    });
  }

  /**
   * Forces an update of the current selected directory
   *
   * As all nodes point by their path on an directory object, the easiest way is to update
   * the objects by merge with their latest change.
   */
  private forceDirRefresh(path?: string) {
    if (!path) {
      if (!this.selectedDir) {
        throw 'This function can only be called without path if an selection was made';
      }
      // Parent has to be called in order to update the object referring
      // to the current selected directory
      path = this.selectedDir.parent;
    }
    this.cephfsService.lsDir(this.id, path).subscribe((data) => {
      data.forEach((d) => {
        const currentDirObject = this.dirs.find((sub) => sub.path === d.path);
        if (currentDirObject) {
          Object.assign(currentDirObject, d);
        } else {
          // It's a new directory! Which has to be included in the tree.
          // Find parent in tree and call reload function
          // add to dirs
          this.dirs.push(d);
          // adds to nodes
          const children = this.getChildren(d.parent);
          // adds to parent node children
          const parent = this.treeComponent.treeModel.getNodeById(d.parent);
          parent.data.children = children;
          parent.data.hasChildren = children.length > 0;
          // updates tree if not recognized
        }
      });
      // Update quotas for selected path
      const selectedNode = this.getSelectedNode();
      if (selectedNode) {
        //this.selectNode(selectedNode);
        this.setSettings(selectedNode);
      }
      this.tree = [...this.tree];
    });
  }

  deleteSnapshotModal() {
    this.modalRef = this.modalService.show(CriticalConfirmationModalComponent, {
      initialState: {
        itemDescription: this.i18n('CephFs Snapshot'),
        itemNames: this.snapshot.selection.selected.map(
          (snapshot: CephfsSnapshot) => snapshot.name
        ),
        submitAction: () => this.deleteSnapshot()
      }
    });
  }

  deleteSnapshot() {
    const path = this.selectedDir.path;
    this.snapshot.selection.selected.forEach((snapshot: CephfsSnapshot) => {
      const name = snapshot.name;
      this.cephfsService.rmSnapshot(this.id, path, name).subscribe(() => {
        this.notificationService.show(
          NotificationType.success,
          this.i18n('Deleted snapshot "{{name}}" for "{{path}}"', {
            name: name,
            path: path
          })
        );
      });
    });
    this.modalRef.hide();
    this.forceDirRefresh();
  }

  refreshAllDirectories() {
    if (this.selectedDir && !this.requestedPaths.includes(this.selectedDir.path)) {
      this.requestedPaths.push(this.selectedDir.path);
    }
    this.requestedPaths.forEach((path) => this.forceDirRefresh(path));
    this.tree = [...this.tree];
  }
}
