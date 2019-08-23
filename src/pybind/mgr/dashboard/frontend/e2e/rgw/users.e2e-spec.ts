import { Helper } from '../helper.po';

describe('RGW users page', () => {
  let users: Helper['users'];
  const validUser = '000user_create_edit_delete';
  const invalidCreateUser = '000invalid_create_user';
  const invalidEditUser = '000invalid_edit_user';

  beforeAll(() => {
    users = new Helper().users;

    // Delete tests users from failed tests
    users.deletePresentUsers([validUser, invalidCreateUser, invalidEditUser]);
  });

  afterEach(() => {
    Helper.checkConsole();
  });

  describe('breadcrumb test', () => {
    beforeAll(() => {
      users.navigateTo();
    });

    it('should open and show breadcrumb', () => {
      expect(users.getBreadcrumbText()).toEqual('Users');
    });
  });

  describe('create, edit & delete user test', () => {
    beforeAll(() => {
      users.navigateTo();
    });

    it('should create user', () => {
      users.create(validUser, 'Some Name', 'original@website.com', '1200');
      expect(users.getTableCell(validUser).isPresent()).toBe(true);
    });

    it('should edit users full name, email and max buckets', () => {
      users.edit(validUser, 'Another Identity', 'changed@othersite.com', '1969');
      // checks for successful editing are done within edit function
    });

    it('should delete user', () => {
      users.delete(validUser);
      expect(users.getTableCell(validUser).isPresent()).toBe(false);
    });
  });

  describe('Invalid input test', () => {
    beforeAll(() => {
      users.navigateTo();
    });

    it('should put invalid input into user creation form and check fields are marked invalid', () => {
      users.invalidCreate(invalidCreateUser);
    });

    it('should put invalid input into user edit form and check fields are marked invalid', () => {
      users.invalidEdit(invalidEditUser);
    });
  });
});
