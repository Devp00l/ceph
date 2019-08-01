import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { NotificationType } from '../enum/notification-type.enum';
import { CdNotificationConfig } from '../models/cd-notification';
import { FinishedTask } from '../models/finished-task';
import { AuthStorageService } from './auth-storage.service';
import { NotificationService } from './notification.service';
import { PermanentNotificationService } from './permanent-notification.service';

@Injectable({
  providedIn: 'root'
})
export class ApiInterceptorService implements HttpInterceptor {
  private permanentNotificationId: number = undefined;
  private successfulResp = 0;

  constructor(
    private router: Router,
    private authStorageService: AuthStorageService,
    public notificationService: NotificationService,
    public permanentNotificationService: PermanentNotificationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap(() => {
        this.removeNotification();
      }),
      catchError((resp) => {
        this.successfulResp = 0;
        if (resp instanceof HttpErrorResponse) {
          let timeoutId: number;
          switch (resp.status) {
            case 400:
              const finishedTask = new FinishedTask();

              const task = resp.error.task;
              if (_.isPlainObject(task)) {
                task.metadata.component = task.metadata.component || resp.error.component;

                finishedTask.name = task.name;
                finishedTask.metadata = task.metadata;
              } else {
                finishedTask.metadata = resp.error;
              }

              finishedTask.success = false;
              finishedTask.exception = resp.error;
              timeoutId = this.notificationService.notifyTask(finishedTask);
              break;
            case 401:
              this.authStorageService.remove();
              this.router.navigate(['/login']);
              break;
            case 403:
              this.router.navigate(['/403']);
              break;
            case 504:
              this.permanentNotificationId = this.prepareNotification(resp, true);
              break;
            default:
              timeoutId = this.prepareNotification(resp);
          }

          /**
           * Decorated preventDefault method (in case error previously had
           * preventDefault method defined). If called, it will prevent a
           * notification to be shown.
           */
          resp['preventDefault'] = () => {
            this.notificationService.cancel(timeoutId);
          };

          /**
           * If called, it will prevent a notification for the specific status code.
           * @param {number} status The status code to be ignored.
           */
          resp['ignoreStatusCode'] = function(status: number) {
            if (this.status === status) {
              this.preventDefault();
            }
          };
        }
        // Return the error to the method that called it.
        return observableThrowError(resp);
      })
    );
  }

  private prepareNotification(resp, isPermanent = false): number {
    const service = isPermanent ? this.permanentNotificationService : this.notificationService;
    return service.show(() => {
      let message = '';
      if (_.isPlainObject(resp.error) && _.isString(resp.error.detail)) {
        message = resp.error.detail; // Error was triggered by the backend.
      } else if (_.isString(resp.error)) {
        message = resp.error;
      } else if (_.isString(resp.message)) {
        message = resp.message;
      }
      return new CdNotificationConfig(
        NotificationType.error,
        `${resp.status} - ${resp.statusText}`,
        message,
        undefined,
        resp['application'],
        isPermanent
      );
    });
  }

  private removeNotification() {
    if (this.permanentNotificationId) {
      // TODO: Find a better way to mute the notification
      if (this.successfulResp >= 4) {
        this.permanentNotificationService.removeNotificationById(this.permanentNotificationId);
        this.permanentNotificationId = undefined;
        this.successfulResp = 0;
      } else {
        this.successfulResp++;
      }
    }
  }
}
