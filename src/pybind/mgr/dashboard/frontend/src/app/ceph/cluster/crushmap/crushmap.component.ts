import { Component, OnInit, ViewChild } from '@angular/core';

import { NodeEvent, TreeModel } from 'ng2-tree';

import { HealthService } from '../../../shared/api/health.service';
import { ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode } from 'angular-tree-component';

@Component({
  selector: 'cd-crushmap',
  templateUrl: './crushmap.component.html',
  styleUrls: ['./crushmap.component.scss']
})
export class CrushmapComponent implements OnInit {
  @ViewChild(TreeComponent, { static: false })
  treeComponent: TreeComponent;

  tree: any;
  treeOptions: ITreeOptions = {
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          if (node.id === 'root') {
            return;
          }
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
  metadataKeyMap: { [key: number]: number } = {};

  constructor(private healthService: HealthService) {}

  ngOnInit() {
    this.healthService.getFullHealth().subscribe((data: any) => {
      this.tree = this._abstractTreeData(data);
      console.log(this.tree);
    });
  }

  _abstractTreeData(data: any) {
    const nodes = data.osd_map.tree.nodes || [];
    const treeNodeMap: { [key: number]: any } = {};

    if (0 === nodes.length) {
      return {
        name: 'No nodes!',
        id: 'root',
        hasChildren: false
      };
    }

    const roots = [];
    nodes.reverse().forEach((node) => {
      if (node.type === 'root') {
        roots.push(node.id);
      }
      treeNodeMap[node.id] = this.generateTreeLeaf(node, treeNodeMap);
    });

    const children = roots.map((id) => {
      return treeNodeMap[id];
    });

    return {
      name: 'CRUSH map',
      children: children,
      id: 'root',
      isExpanded: true
    };
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
