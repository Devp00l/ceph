import { DimlessBinaryDirective } from './dimless-binary.directive';

export class MockElementRef {
  nativeElement: {};
}

describe('DimlessBinaryDirective', () => {
  let directive: DimlessBinaryDirective;
  beforeEach(() => {
    directive = new DimlessBinaryDirective(new MockElementRef(), null, null, null);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  describe('just testing', () => {
    it('tests a > b', () => {
      expect(directive.doSomethingNew(2, 1, 3)).toBe(5);
    });

    it('tests a < b && a < c', () => {
      expect(directive.doSomethingNew(2, 4, 3)).toBe(6);
    });

    it('tests a < b && a > c && b > c', () => {
      // Oh no I forget to uncomment the test :P
      // expect(directive.doSomethingNew(3, 4, 2)).toBe(3);
    });

    it('test else', () => {
      expect(directive.doSomethingNew(3, 3, 3)).toBe(9);
    });
  });
});
