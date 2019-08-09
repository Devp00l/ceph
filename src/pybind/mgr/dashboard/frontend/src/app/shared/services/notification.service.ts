import { Injectable } from '@angular/core';

import * as _ from 'lodash';
import {ActiveToast, IndividualConfig, ToastrService} from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';

import { NotificationType } from '../enum/notification-type.enum';
import { CdNotificationConfig } from '../models/cd-notification';
import { FinishedTask } from '../models/finished-task';
import { TaskMessageService } from './task-message.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hideToasties = false;

  // Observable sources
  private dataSource = new BehaviorSubject<CdNotificationConfig[]>([]);

  // Observable streams
  data$ = this.dataSource.asObservable();

  private queued: CdNotificationConfig[] = [];
  private queuedTimeoutId: number;
  KEY = 'cdNotifications';

  constructor(public toastr: ToastrService, private taskMessageService: TaskMessageService) {
    const stringNotifications = localStorage.getItem(this.KEY);
    let notifications: CdNotificationConfig[] = [];

    if (_.isString(stringNotifications)) {
      notifications = JSON.parse(stringNotifications, (_key, value) => {
        if (_.isPlainObject(value)) {
          return _.assign(new CdNotificationConfig(), value);
        }
        return value;
      });
    }

    this.dataSource.next(notifications);
  }

  /**
   * Removes all current saved notifications
   */
  removeAll() {
    localStorage.removeItem(this.KEY);
    this.dataSource.next([]);
  }

  /**
   * Method used for saving a shown notification (check show() method).
   */
  save(notification: CdNotificationConfig) {
    const recent = this.dataSource.getValue();
    recent.push(notification);
    while (recent.length > 10) {
      recent.shift();
    }
    this.dataSource.next(recent);
    localStorage.setItem(this.KEY, JSON.stringify(recent));
  }

  /**
   * Method for showing a notification.
   * @param {NotificationType} type toastr type
   * @param {string} title
   * @param {string} [message] The message to be displayed. Note, use this field
   *   for error notifications only.
   * @param {*} [options] toastr compatible options, used when creating a toastr
   * @param {string} [application] Only needed if notification comes from an external application
   * @param {boolean} [isPermanent] Set if the notification will be closed by itself.
   * @returns The timeout ID that is set to be able to cancel the notification.
   */
  show(
    type: NotificationType,
    title: string,
    message?: string,
    options?: any | IndividualConfig,
    application?: string,
    isPermanent?: boolean,
  ): number;
  show(config: CdNotificationConfig | (() => CdNotificationConfig)): number;
  show(
    arg: NotificationType | CdNotificationConfig | (() => CdNotificationConfig),
    title?: string,
    message?: string,
    options?: any | IndividualConfig,
    application?: string,
    isPermanent?: boolean,
  ): number {
    const getConfig = () =>
      this.getNotificationConfig(arg, title, message, options, application, isPermanent);
    const config = getConfig();
    if (config.isPermanent) {
      return this.permToShow(config);
    } else {
      return window.setTimeout(() => {
        this.queueToShow(getConfig());
      }, 10);
    }
  }

  removeNotificationById(id: number) {
    this.toastr.remove(id);
  }

  removeNotificationByTitle(title: string) {
    this.toastr.toasts.forEach((toast) => {
      if (toast.toastRef.componentInstance.title === title) {
        this.toastr.remove(toast.toastId);
      }
    });
  }

  private getNotificationConfig(
    arg: NotificationType | CdNotificationConfig | (() => CdNotificationConfig),
    title?: string,
    message?: string,
    options?: any | IndividualConfig,
    application?: string,
    isPermanent?: boolean
  ): CdNotificationConfig {
    let config: CdNotificationConfig;
    if (_.isFunction(arg)) {
      config = arg() as CdNotificationConfig;
    } else if (_.isObject(arg)) {
      config = arg as CdNotificationConfig;
    } else {
      config = new CdNotificationConfig(
        arg as NotificationType,
        title,
        message,
        options,
        application,
        isPermanent
      );
    }
    return config;
  }

  private permToShow(config: CdNotificationConfig) {
    const existingToast = _.find(this.toastr.toasts, (t) => {
      if (t.toastRef.componentInstance.title === config.title) {
        return t;
      }
    }) as ActiveToast<any>;
    if (existingToast) {
      const existingMessage = existingToast.message.includes(config.message);
      if (existingMessage) {
        return;
      }
      let messageUpdate = '';
      if (existingToast.message.includes('</ul>')) {
        messageUpdate = _.replace(existingToast.message, '</ul>', '');
        messageUpdate = messageUpdate + '<li>' + config.message + '</li></ul>';
      } else {
        messageUpdate =
          '<ul><li>' +
          existingToast.message +
          '</li><li>' +
          config.message +
          '</li></ul>';
      }
      this.toastr.remove(existingToast.toastId);
      config.message = messageUpdate;
    }

    const newNotification = this.toastr[['error', 'info', 'success'][config.type]](
      config.message,
      config.title,
      config.options
    );
    return newNotification.toastId;
  }

  private queueToShow(config: CdNotificationConfig) {
    this.cancel(this.queuedTimeoutId);
    if (!this.queued.find((c) => _.isEqual(c, config))) {
      this.queued.push(config);
    }
    this.queuedTimeoutId = window.setTimeout(() => {
      this.showQueued();
    }, 500);
  }

  private showQueued() {
    this.getUnifiedTitleQueue().forEach((config) => {
      this.save(config);
      this.showToasty(config);
    });
  }

  private getUnifiedTitleQueue(): CdNotificationConfig[] {
    return Object.values(this.queueShiftByTitle()).map((configs) => {
      const config = configs[0];
      if (configs.length > 1) {
        config.message = '<ul>' + configs.map((c) => `<li>${c.message}</li>`).join('') + '</ul>';
      }
      return config;
    });
  }

  private queueShiftByTitle(): { [key: string]: CdNotificationConfig[] } {
    const byTitle: { [key: string]: CdNotificationConfig[] } = {};
    let config: CdNotificationConfig;
    while ((config = this.queued.shift())) {
      if (!byTitle[config.title]) {
        byTitle[config.title] = [];
      }
      byTitle[config.title].push(config);
    }
    return byTitle;
  }

  private showToasty(notification: CdNotificationConfig) {
    // Exit immediately if no toasty should be displayed.
    if (this.hideToasties) {
      return;
    }
    this.toastr[['error', 'info', 'success'][notification.type]](
      notification.message,
      notification.title,
      notification.options
    );
  }

  notifyTask(finishedTask: FinishedTask, success: boolean = true): number {
    let notification: CdNotificationConfig;
    if (finishedTask.success && success) {
      notification = new CdNotificationConfig(
        NotificationType.success,
        this.taskMessageService.getSuccessTitle(finishedTask)
      );
    } else {
      notification = new CdNotificationConfig(
        NotificationType.error,
        this.taskMessageService.getErrorTitle(finishedTask),
        this.taskMessageService.getErrorMessage(finishedTask)
      );
    }
    return this.show(notification);
  }

  /**
   * Prevent the notification from being shown.
   * @param {number} timeoutId A number representing the ID of the timeout to be canceled.
   */
  cancel(timeoutId) {
    window.clearTimeout(timeoutId);
  }

  /**
   * Suspend showing the notification toasties.
   * @param {boolean} suspend Set to ``true`` to disable/hide toasties.
   */
  suspendToasties(suspend: boolean) {
    this.hideToasties = suspend;
  }
}
