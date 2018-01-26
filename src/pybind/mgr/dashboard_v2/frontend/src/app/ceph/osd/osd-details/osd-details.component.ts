import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'oa-osd-details',
  templateUrl: './osd-details.component.html',
  styleUrls: ['./osd-details.component.scss']
})
export class OsdDetailsComponent implements OnInit {
  @Input() selected?: any[];

  constructor() { }

  ngOnInit() {
  }
}
