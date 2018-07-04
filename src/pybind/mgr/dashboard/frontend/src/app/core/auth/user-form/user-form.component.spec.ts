import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ToastModule } from 'ng2-toastr';
import { of } from 'rxjs';

import { UserService } from '../../../shared/api/user.service';
import { ComponentsModule } from '../../../shared/components/components.module';
import { SharedModule } from '../../../shared/shared.module';
import { configureTestBed } from '../../../shared/unit-test-helper';
import { UserFormComponent } from './user-form.component';
import { UserFormModel } from './user-form.model';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let form: FormGroup;
  let fixture: ComponentFixture<UserFormComponent>;
  let userService: UserService;

  configureTestBed({
    imports: [
      HttpClientTestingModule,
      ReactiveFormsModule,
      RouterTestingModule,
      ComponentsModule,
      ToastModule.forRoot(),
      SharedModule
    ],
    declarations: [UserFormComponent]
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    form = component.userForm;
    userService = TestBed.get(UserService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(form).toBeTruthy();
  });

  describe('create mode', () => {
    let router: Router;
    const setUrl = (url) => Object.defineProperty(router, 'url', { value: url });

    beforeEach(() => {
      router = TestBed.get(Router);
      setUrl('/users/add');
      component.ngOnInit();
    });

    it('should not disable fields', () => {
      expect(form.get('username').disabled).toBeFalsy();
      expect(form.get('name').disabled).toBeFalsy();
      expect(form.get('password').disabled).toBeFalsy();
      expect(form.get('confirmpassword').disabled).toBeFalsy();
      expect(form.get('email').disabled).toBeFalsy();
      expect(form.get('roles').disabled).toBeFalsy();
    });

    it('should validate username required', () => {
      form.get('username').setValue('');
      expect(form.get('username').hasError('required')).toBeTruthy();
    });

    it('should validate password required', () => {
      form.get('password').setValue('');
      form.get('confirmpassword').setValue('');
      expect(form.get('password').hasError('required')).toBeTruthy();
      expect(form.get('confirmpassword').hasError('required')).toBeTruthy();
    });

    it('should validate password match', () => {
      form.get('password').setValue('aaa');
      form.get('confirmpassword').setValue('bbb');
      expect(form.get('confirmpassword').hasError('match')).toBeTruthy();
      form.get('confirmpassword').setValue('aaa');
      expect(form.get('confirmpassword').valid).toBeTruthy();
    });

    it('should validate email', () => {
      form.get('email').setValue('aaa');
      expect(form.get('email').hasError('email')).toBeTruthy();
    });

    it('should set mode', () => {
      expect(component.mode).toBeUndefined();
    });

    it('should submit', () => {
      spyOn(userService, 'create').and.callThrough();
      const user: UserFormModel = {
        username: 'user0',
        password: 'pass0',
        name: 'User 0',
        email: 'user0@email.com',
        roles: ['administrator']
      };
      Object.keys(user).forEach((k) => form.get(k).setValue(user[k]));
      form.get('confirmpassword').setValue(user.password);
      component.submit();
      expect(userService.create).toHaveBeenCalledWith(user);
    });
  });

  describe('edit mode', () => {
    let router: Router;
    const setUrl = (url) => Object.defineProperty(router, 'url', { value: url });
    let user: UserFormModel;
    beforeEach(() => {
      router = TestBed.get(Router);
      user = new UserFormModel();
      user.username = 'user1';
      user.name = 'User 1';
      user.email = 'user1@email.com';
      user.roles = ['administrator'];
      spyOn(userService, 'get').and.callFake(() => of(user));
      setUrl('/users/edit/user1');
      component.ngOnInit();
    });

    it('should disable fields if editing', () => {
      expect(form.get('username').disabled).toBeTruthy();
      ['name', 'password', 'confirmpassword', 'email', 'roles'].forEach((controlName) =>
        expect(form.get(controlName).disabled).toBeFalsy()
      );
    });

    it('should set control values', () => {
      // Change to getValue through usage of CdFormGroup
      expect(form.get('username').value).toBe(user.username);
      expect(form.get('name').value).toBe(user.name);
      expect(form.get('password').value).toBe('');
      expect(form.get('confirmpassword').value).toBe('');
      expect(form.get('email').value).toBe(user.email);
      expect(form.get('roles').value).toBe(user.roles);
    });

    it('should set mode', () => {
      expect(component.mode).toBe('editing');
    });

    it('should validate password not required', () => {
      ['password', 'confirmpassword'].forEach((controlName) => {
        form.get(controlName).setValue('');
        expect(form.get(controlName).hasError('required')).toBeFalsy();
      });
    });

    it('should submit', () => {
      spyOn(userService, 'update').and.callThrough();
      component.submit();
      expect(userService.update).toHaveBeenCalledWith({
        username: 'user1',
        password: '',
        name: 'User 1',
        email: 'user1@email.com',
        roles: ['administrator']
      });
    });
  });
});
