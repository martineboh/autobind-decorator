import 'core-js/modules/es6.reflect';
import 'core-js/modules/es6.symbol';
import assert from 'assert';
import autobind from '../';

describe('autobind method decorator', function() {

  class A {

    constructor() {
      this.value = 42;
    }

    @autobind
    getValue() {
      return this.value;
    }
  }

  it('binds methods to an instance', function() {
    let a = new A();
    let getValue = a.getValue;
    assert(getValue() === 42);
  });

  it('binds method only once', function() {
    let a = new A();
    assert(a.getValue === a.getValue);
  });

  /** parse errors. Submitted issue to babel #1238
  it('binds methods with symbols as keys', function () {
    var symbol = Symbol('method');
    class A {
      constructor () {
        this.val = 42;
      }
      @autobind
      [symbol] () {
        return this.val;
      }
    }
    let a = new A();
    let getValue = a[symbol];
    assert(getValue() === 42);
  });
  */

  it('throws if applied on a method of more than zero arguments', function() {
    assert.throws(() => {
      class A { // eslint-disable-line no-unused-vars
        @autobind
        get value() {
          return 1;
        }
      }
    }, /@autobind decorator can only be applied to methods/);
  });

  it('should not override bound instance method, while calling super method with the same name', function() { // eslint-disable-line max-len
    class B extends A {

      @autobind
      getValue() {
        return super.getValue() + 8;
      }
    }

    let b = new B();
    let value = b.getValue();
    value = b.getValue();

    assert(value === 50);
  });
});

describe('autobind class decorator', function() {

  let symbol = Symbol('getValue');

  @autobind
  class A {

    constructor() {
      this.value = 42;
    }

    getValue() {
      return this.value;
    }

    [symbol] () {
      return this.value;
    }
  }

  it('binds methods to an instance', function() {
    let a = new A();
    let getValue = a.getValue;
    assert(getValue() === 42);
  });

  it('binds method only once', function() {
    let a = new A();
    assert(a.getValue === a.getValue);
  });

  it('ignores non method values', function() {
    assert.doesNotThrow(() => {
      @autobind
      class A { // eslint-disable-line no-unused-vars
        get value() {
          return 1;
        }
      }
    });
  });

  it('does not override itself when accessed on the prototype', function() {
    A.prototype.getValue; // eslint-disable-line no-unused-expressions

    let a = new A();
    let getValue = a.getValue;
    assert(getValue() === 42);

    const foo = {
      value: 10,
      getValue: A.prototype.getValue
    };

    assert.equal(foo.getValue(), 10);
  });

  describe('with Reflect', function () {
    describe('with Symbols', function () {
      it('binds methods with symbol keys', function () {
        let a = new A();
        let getValue = a[symbol];
        assert(getValue() === 42);
      });
    });
  });

  describe('without Reflect', function () {
    // remove Reflect pollyfill
    let _Reflect = Reflect;
    let A;

    before(function () {
      Reflect = undefined;

      @autobind
      class B {
        constructor() {
          this.value = 42;
        }
        getValue() {
          return this.value;
        }
        [symbol] () {
          return this.value;
        }
      }
      A = B;
    });

    after(function () {
      Reflect = _Reflect;
    });

    it('falls back to Object.getOwnPropertyNames', function () {
      let a = new A();
      let getValue = a.getValue;
      assert(getValue() === 42);
    });

    describe('with Symbols', function () {
      it('falls back to Object.getOwnPropertySymbols', function () {
        let a = new A();
        let getValue = a[symbol];
        assert(getValue() === 42);
      });
    });

    describe('without Symbols', function () {
      let _Symbol = Symbol;
      let _getOwnPropertySymbols = Object.getOwnPropertySymbols;
      let A;

      before(function () {
        Symbol = undefined;
        Object.getOwnPropertySymbols = undefined;

        @autobind
        class B {
          constructor() {
            this.value = 42;
          }
          getValue() {
            return this.value;
          }
        }
        A = B;
      });

      after(function () {
        Symbol = _Symbol;
        Object.getOwnPropertySymbols = _getOwnPropertySymbols;
      });

      it('does throws no error if Symbol is not supported', function () {
        let a = new A();
        let getValue = a.getValue;
        assert(getValue() === 42);
      });
    });
  });
});

describe('set new value', function() {
  class A {
    constructor() {
      this.data = 'A';
      this.foo = 'foo';
      this.bar = 'bar';
    }

    @autobind
    noop() {
      return this.data;
    }
  }

  const a = new A();

  it('should not throw when reassigning to an object', function () {
    a.noop = {
      foo: 'bar'
    };
    assert.deepEqual(a.noop, {
      foo: 'bar'
    });
    assert.equal(a.noop, a.noop);
  });

  it('should not throw when reassigning to a function', function() {
    a.noop = function noop () {
      return this.foo;
    };
    assert.equal(a.noop(), 'foo');
    const noop = a.noop;
    assert.equal(noop(), 'foo');
    assert.equal(a.noop, a.noop);
  });

  it('should not throw when reassigning to a function again', function() {
    a.noop = function noop2 () {
      return this.bar;
    };
    assert(a.noop(), 'bar');
    const noop2 = a.noop;
    assert.equal(noop2(), 'bar');
    assert.equal(a.noop, a.noop);
  });

  it('should not throw when reassigning to an object after bound a function', function() {
    a.noop = {};
    assert.deepEqual(a.noop, {});
    assert.equal(a.noop, a.noop);
  });
});
