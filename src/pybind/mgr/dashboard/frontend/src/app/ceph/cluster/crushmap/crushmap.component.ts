import { Component, OnInit, ViewChild } from '@angular/core';

import { ITreeOptions, TREE_ACTIONS, TreeComponent } from 'angular-tree-component';

import { HealthService } from '../../../shared/api/health.service';

@Component({
  selector: 'cd-crushmap',
  templateUrl: './crushmap.component.html',
  styleUrls: ['./crushmap.component.scss']
})
export class CrushmapComponent implements OnInit {
  @ViewChild(TreeComponent, { static: false })
  treeComponent: TreeComponent;

  nodes: any;
  treeOptions: ITreeOptions = {
    actionMapping: {
      mouse: {
        click: (tree, node, _event) => {
          TREE_ACTIONS.TOGGLE_ACTIVE(undefined, node, undefined);
          const { name, type, status, ...remain } = this.metadataKeyMap[node.id];
          this.metadata = remain;
          this.metadataTitle = name + ' (' + type + ')';
        }
      }
    }
  };
  metadata: any;
  metadataTitle: string;
  metadataKeyMap: { [key: number]: any } = {};

  constructor(private healthService: HealthService) {}

  ngOnInit() {
    this.healthService.getFullHealth().subscribe((data: any) => {
      this.nodes = this._abstractTreeData(data);
    });
  }

  _abstractTreeData(data: any) {
    const nodes = data.osd_map.tree.nodes || [];
    const treeNodeMap: { [key: number]: any } = {};

    if (nodes.length === 0) {
      return [{ name: 'No nodes!' }];
    }

    const roots = [];
    nodes.reverse().forEach((node) => {
      if (node.type === 'root') {
        roots.push(node.id);
      }
      treeNodeMap[node.id] = this.generateTreeLeaf(node, treeNodeMap);
    });

    return roots.map((id) => {
      return treeNodeMap[id];
    });
  }

  private generateTreeLeaf(node: any, treeNodeMap) {
    const id = node.id;
    this.metadataKeyMap[id] = node;

    const value: string = node.name + ' (' + node.type + ')';
    const status: string = node.status;

    const children: any[] = [];
    const resultNode = { name: value, status, id, type: node.type };
    if (node.children) {
      node.children.sort().forEach((childId) => {
        children.push(treeNodeMap[childId]);
      });

      resultNode['children'] = children;
      resultNode['isExpanded'] = true;
    }

    return resultNode;
  }
}
