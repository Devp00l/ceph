import { $, browser, by, element } from 'protractor';
import { protractor } from 'protractor/built/ptor';
import { Helper } from '../helper.po';
import { PageHelper } from '../page-helper.po';

export class UsersPageHelper extends PageHelper {
  pages = {
    index: '/#/rgw/user',
    create: '/#/rgw/user/create'
  };

  create(username, fullname, email, maxbuckets) {
    this.navigateTo('create');

    expect(this.getBreadcrumbText()).toBe('Create');

    this.setInputsById({
      uid: username,
      display_name: fullname,
      email: email,
      max_buckets: maxbuckets
    });

    // Click the create button and wait for user to be made
    const createButton = element(by.cssContainingText('button', 'Create User'));
    this.moveClick(createButton).then(() => {
      browser.wait(Helper.EC.presenceOf(this.getTableCell(username)), Helper.TIMEOUT);
    });
  }

  edit(name, new_fullname, new_email, new_maxbuckets) {
    this.navigateTo();

    browser.wait(Helper.EC.elementToBeClickable(this.getTableCell(name)), Helper.TIMEOUT); // wait for table to load
    this.getTableCell(name).click(); // click on the bucket you want to edit in the table
    element(by.cssContainingText('button', 'Edit')).click(); // click button to move to edit page

    expect(this.getBreadcrumbText()).toEqual('Edit');

    this.setInputsById({
      display_name: new_fullname,
      email: new_email,
      max_buckets: new_maxbuckets
    });

    const editbutton = element(by.cssContainingText('button', 'Edit User'));
    this.moveClick(editbutton).then(() => {
      browser
        .wait(Helper.EC.elementToBeClickable(this.getTableCell(name)), Helper.TIMEOUT)
        .then(() => {
          // Click the user and check its details table for updated content
          this.getTableCell(name).click();
          expect($('.active.tab-pane').getText()).toMatch(new_fullname); // check full name was changed
          expect($('.active.tab-pane').getText()).toMatch(new_email); // check email was changed
          expect($('.active.tab-pane').getText()).toMatch(new_maxbuckets); // check max buckets was changed
        });
    });
  }

  delete(name) {
    this.navigateTo();

    // wait for table to load
    const my_user = this.getFirstTableCellWithText(name);
    browser.wait(Helper.EC.elementToBeClickable(my_user), Helper.TIMEOUT);

    my_user.click(); // click on the user you want to delete in the table
    $('.table-actions button.dropdown-toggle').click(); // click toggle menu
    $('li.delete a').click(); // click delete

    // wait for pop-up to be visible (checks for title of pop-up)
    browser.wait(Helper.EC.visibilityOf($('.modal-title.float-left')), Helper.TIMEOUT).then(() => {
      browser.wait(Helper.EC.visibilityOf($('.custom-control-label')), Helper.TIMEOUT);
      $('.custom-control-label').click(); // click confirmation checkbox
      element(by.cssContainingText('button', 'Delete user'))
        .click()
        .then(() => {
          browser.wait(
            Helper.EC.not(Helper.EC.presenceOf(this.getFirstTableCellWithText(name))),
            Helper.TIMEOUT
          );
        });
    });
  }

  invalidCreate() {
    const uname = '000invalid_create_user';
    // creating this user in order to check that you can't give two users the same name
    this.create(uname, 'xxx', 'xxx@xxx', '1');

    this.navigateTo('create');

    const username_field = element(by.id('uid'));

    // No username had been entered. Field should be invalid
    expect(username_field.getAttribute('class')).toContain('ng-invalid');

    // Try to give user already taken name. Should make field invalid.
    this.setInput(username_field, uname);
    const name = element(by.id('display_name'));
    browser
      .wait(function() {
        return username_field.getAttribute('class').then(function(classValue) {
          return classValue.indexOf('ng-pending') === -1;
        });
      }, Helper.TIMEOUT)
      .then(() => {
        expect(username_field.getAttribute('class')).toContain('ng-invalid');
        this.moveClick(name); // trigger validation check
        expect(element(by.css('#uid + .invalid-feedback')).getText()).toMatch(
          'The chosen user ID is already in use.'
        );
      });

    // check that username field is marked invalid if username has been cleared off
    for (let i = 0; i < uname.length; i++) {
      username_field.sendKeys(protractor.Key.BACK_SPACE);
    }
    expect(username_field.getAttribute('class')).toContain('ng-invalid');
    this.moveClick(element(by.id('display_name'))); // trigger validation check
    expect(element(by.css('#uid + .invalid-feedback')).getText()).toMatch(
      'This field is required.'
    );

    // No display name has been given so field should be invalid
    expect(element(by.id('display_name')).getAttribute('class')).toContain('ng-invalid');

    // display name field should also be marked invalid if given input then emptied
    this.moveClick(element(by.id('display_name')));
    element(by.id('display_name')).sendKeys('a');
    element(by.id('display_name')).sendKeys(protractor.Key.BACK_SPACE);
    expect(element(by.id('display_name')).getAttribute('class')).toContain('ng-invalid');
    this.moveClick(username_field); // trigger validation check
    expect(element(by.css('#display_name + .invalid-feedback')).getText()).toMatch(
      'This field is required.'
    );

    // put invalid email to make field invalid
    this.moveClick(element(by.id('email')));
    element(by.id('email')).sendKeys('a');
    expect(element(by.id('email')).getAttribute('class')).toContain('ng-invalid');
    this.moveClick(username_field); // trigger validation check
    expect(element(by.css('#email + .invalid-feedback')).getText()).toMatch(
      'This is not a valid email address.'
    );

    // put negative max buckets to make field invalid
    this.moveClick(element(by.id('max_buckets')));
    element(by.id('max_buckets')).clear();
    element(by.id('max_buckets')).sendKeys('-5');
    expect(element(by.id('max_buckets')).getAttribute('class')).toContain('ng-invalid');
    this.moveClick(username_field); // trigger validation check
    expect(element(by.css('#max_buckets + .invalid-feedback')).getText()).toMatch(
      'The entered value must be >= 0.'
    );

    this.delete(uname);
  }

  invalidEdit() {
    const uname = '000invalid_edit_user';
    // creating this user to edit for the test
    this.create(uname, 'xxx', 'xxx@xxx', '1');

    this.navigateTo();

    browser.wait(Helper.EC.elementToBeClickable(this.getTableCell(uname)), Helper.TIMEOUT); // wait for table to load
    this.getTableCell(uname).click(); // click on the bucket you want to edit in the table
    element(by.cssContainingText('button', 'Edit')).click(); // click button to move to edit page

    expect(this.getBreadcrumbText()).toEqual('Edit');

    // put invalid email to make field invalid
    const email = element(by.id('email'));
    const name = element(by.id('display_name'));
    this.setInput(email, 'a');
    browser
      .wait(function() {
        return element(by.id('email'))
          .getAttribute('class')
          .then(function(classValue) {
            return classValue.indexOf('ng-pending') === -1;
          });
      }, 6000)
      .then(() => {
        expect(element(by.id('email')).getAttribute('class')).toContain('ng-invalid');
        this.moveClick(element(by.id('display_name'))); // trigger validation check
        expect(element(by.css('#email + .invalid-feedback')).getText()).toMatch(
          'This is not a valid email address.'
        );
      });

    // empty the display name field making it invalid
    this.moveClick(element(by.id('display_name')));
    for (let i = 0; i < 3; i++) {
      element(by.id('display_name')).sendKeys(protractor.Key.BACK_SPACE);
    }
    expect(element(by.id('display_name')).getAttribute('class')).toContain('ng-invalid');
    this.moveClick(element(by.id('email'))); // trigger validation check
    expect(element(by.css('#display_name + .invalid-feedback')).getText()).toMatch(
      'This field is required.'
    );

    // put negative max buckets to make field invalid
    const maxBuckets = element(by.id('max_buckets'));
    this.setInput(maxBuckets, '-5');
    expect(maxBuckets.getAttribute('class')).toContain('ng-invalid');
    this.moveClick(email); // trigger validation check
    expect(element(by.css('#max_buckets + .invalid-feedback')).getText()).toMatch(
      'The entered value must be >= 0.'
    );

    this.delete(uname);
  }
}
