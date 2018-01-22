import { PgStatusPipe } from './pg-status.pipe';

describe('PgStatusPipe', () => {
  let pipe: PgStatusPipe;

  beforeEach(() => {
    pipe = new PgStatusPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it ('should not fail with not input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it ('should show count and status in the right order', () => {
    expect(pipe.transform({someStatus: 42})).toBe('42 someStatus');
  });
});
