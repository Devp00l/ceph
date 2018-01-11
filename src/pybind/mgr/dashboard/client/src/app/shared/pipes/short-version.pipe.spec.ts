import { ShortVersionPipe } from './short-version.pipe';

describe('ShortVersionPipe', () => {
  it('create an instance', () => {
    const pipe = new ShortVersionPipe();
    expect(pipe).toBeTruthy();
  });
});
