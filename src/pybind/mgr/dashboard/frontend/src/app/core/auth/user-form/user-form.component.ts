import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { RoleService } from '../../../shared/api/role.service';
import { UserService } from '../../../shared/api/user.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { NotificationType } from '../../../shared/enum/notification-type.enum';
import { AuthStorageService } from '../../../shared/services/auth-storage.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { CdValidators } from '../../../shared/validators/cd-validators';
import { UserFormMode } from './user-form-mode.enum';
import { UserFormRoleModel } from './user-form-role.model';
import { UserFormModel } from './user-form.model';

@Component({
  selector: 'cd-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  @ViewChild('removeSelfUserReadUpdatePermissionTpl')
  removeSelfUserReadUpdatePermissionTpl: TemplateRef<any>;

  modalRef: BsModalRef;

  userForm: FormGroup;

  userFormMode = UserFormMode;
  mode: UserFormMode;
  allRoles: Array<UserFormRoleModel>;

  constructor(
    private authStorageService: AuthStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private roleService: RoleService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {
    this.createForm();
  }

  createForm() {
    this.userForm = new FormGroup(
      {
        username: new FormControl('', {
          validators: [Validators.required]
        }),
        name: new FormControl(''),
        password: new FormControl('', {
          validators: []
        }),
        confirmpassword: new FormControl('', {
          updateOn: 'blur',
          validators: []
        }),
        email: new FormControl('', {
          validators: [Validators.email]
        }),
        roles: new FormControl([])
      },
      {
        validators: [CdValidators.match('password', 'confirmpassword')]
      }
    );
  }

  ngOnInit() {
    if (this.router.url.startsWith('/users/edit')) {
      this.mode = this.userFormMode.editing;
    }
    this.roleService.list().subscribe((roles: Array<UserFormRoleModel>) => {
      this.allRoles = roles;
    });
    if (this.mode === this.userFormMode.editing) {
      this.initEdit();
    } else {
      this.initAdd();
    }
  }

  initAdd() {
    this.userForm.get('password').setValidators([Validators.required]);
    this.userForm.get('confirmpassword').setValidators([Validators.required]);
  }

  initEdit() {
    this.userForm.get('password').setValidators([]);
    this.userForm.get('confirmpassword').setValidators([]);
    this.disableForEdit();
    this.route.params.subscribe((params: { username: string }) => {
      const username = params.username;
      this.userService.get(username).subscribe((userFormModel: UserFormModel) => {
        this.setResponse(userFormModel);
      });
    });
  }

  disableForEdit() {
    this.userForm.get('username').disable();
  }

  setResponse(response: UserFormModel) {
    this.userForm.get('username').setValue(response.username);
    this.userForm.get('name').setValue(response.name);
    this.userForm.get('email').setValue(response.email);
    this.userForm.get('roles').setValue(response.roles);
  }

  getRequest(): UserFormModel {
    const userFormModel = new UserFormModel();
    ['username', 'password', 'name', 'email', 'roles'].forEach(
      (key) => (userFormModel[key] = this.userForm.get(key).value)
    );
    return userFormModel;
  }

  createAction() {
    const userFormModel = this.getRequest();
    this.userService.create(userFormModel).subscribe(
      () => {
        this.notificationService.show(
          NotificationType.success,
          `User "${userFormModel.username}" has been created.`,
          'Create User'
        );
        this.router.navigate(['/users']);
      },
      () => {
        this.userForm.setErrors({ cdSubmitButton: true });
      }
    );
  }

  editAction() {
    if (this.isRemoveSelfUserReadUpdatePermission()) {
      const initialState = {
        titleText: 'Update user',
        buttonText: 'Continue',
        bodyTpl: this.removeSelfUserReadUpdatePermissionTpl,
        onSubmit: () => {
          this.modalRef.hide();
          this.doEditAction();
        },
        onCancel: () => {
          this.userForm.setErrors({ cdSubmitButton: true });
          this.userForm.get('roles').reset(this.userForm.get('roles').value);
        }
      };
      this.modalRef = this.modalService.show(ConfirmationModalComponent, { initialState });
    } else {
      this.doEditAction();
    }
  }

  private isRemoveSelfUserReadUpdatePermission(): boolean {
    const isCurrentUser =
      this.authStorageService.getUsername() === this.userForm.get('username').value;
    return isCurrentUser && !this.hasUserReadUpdatePermissions(this.userForm.get('roles').value);
  }

  private hasUserReadUpdatePermissions(roles) {
    let hasReadPermission = false;
    let hasUpdatePermission = false;
    for (const role of this.allRoles) {
      if (roles.indexOf(role.name) !== -1 && role.scopes_permissions['user']) {
        const userPermissions = role.scopes_permissions['user'];
        if (userPermissions.indexOf('read') !== -1) {
          hasReadPermission = true;
        }
        if (userPermissions.indexOf('update') !== -1) {
          hasUpdatePermission = true;
        }
      }
    }
    return hasReadPermission && hasUpdatePermission;
  }

  private doEditAction() {
    const userFormModel = this.getRequest();
    this.userService.update(userFormModel).subscribe(
      () => {
        this.notificationService.show(
          NotificationType.success,
          `User "${userFormModel.username}" has been updated.`,
          'Edit User'
        );
        this.router.navigate(['/users']);
      },
      () => {
        this.userForm.setErrors({ cdSubmitButton: true });
      }
    );
  }

  submit() {
    if (this.mode === this.userFormMode.editing) {
      this.editAction();
    } else {
      this.createAction();
    }
  }
}
