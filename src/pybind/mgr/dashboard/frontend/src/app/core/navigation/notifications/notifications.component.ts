import { Component, OnDestroy, OnInit } from '@angular/core';

import * as _ from 'lodash';

import { CdNotification } from '../../../shared/models/cd-notification';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { PrometheusAlertService } from '../../../shared/services/prometheus-alert.service';
import { PrometheusNotificationService } from '../../../shared/services/prometheus-notification.service';

@Component({
  selector: 'cd-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: CdNotification[];
  private interval: number;

  constructor(
    public notificationService: NotificationService,
    private prometheusNotificationService: PrometheusNotificationService,
    private authStorageService: AuthStorageService,
    private prometheusAlertService: PrometheusAlertService
  ) {
    this.notifications = [];
  }

  ngOnDestroy() {
    window.clearInterval(this.interval);
  }

  ngOnInit() {
    if (this.authStorageService.getPermissions().prometheus.read) {
      this.triggerPrometheusAlerts();
      this.interval = window.setInterval(() => {
        this.triggerPrometheusAlerts();
      }, 5000);
    }
    this.notificationService.data$.subscribe((notifications: CdNotification[]) => {
      this.notifications = _.orderBy(notifications, ['timestamp'], ['desc']);
    });
  }

  private triggerPrometheusAlerts() {
    this.prometheusAlertService.refresh();
    this.prometheusNotificationService.refresh();
  }

  removeAll() {
    this.notificationService.removeAll();
  }
}
