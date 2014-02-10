describe("Navy.Class is class base OOP:", function() {
  /**
   * @class ClassA
   */
  Navy.Class('ClassA', {
    arg1: null,
    arg2: null,
    obj: null,

    initialize: function(arg1, arg2) {
      this.arg1 = arg1;
      this.arg2 = arg2;

      this.obj = {};
    },

    say: function() {
      return 'ClassA#say';
    }
  });

  /**
   * @class ClassB
   */
  Navy.Class('ClassB', {
    say: function() {
      return 'ClassB#sayB';
    }
  });

  it("create instance.", function() {
    var a = new ClassA();
    var b = new ClassB();

    expect(a instanceof ClassA).toBeTruthy();
    expect(b instanceof ClassB).toBeTruthy();
  });

  it('initialize function is called when use "new"', function() {
    var arg1 = 100;
    var arg2 = [-1, -2];
    var a = new ClassA(arg1, arg2);

    expect(a.arg1).toBe(arg1);
    expect(a.arg2).toBe(arg2);
  });

  it('can call method', function() {
    var a = new ClassA();
    expect(a.say()).toBe('ClassA#say');
  });

  it('each instance property are independence.', function() {
    var a1 = new ClassA();
    var a2 = new ClassA();

    a1.obj['food'] = 'rice';

    expect(a1.obj['food']).toBe('rice');
    expect(a2.obj['food']).toBeUndefined();
    expect(a1.obj).not.toBe(a2.obj);
  });
});

describe('Navy.Class special property', function(){
  /**
   * @class Foo.Bar.ClassA
   */
  Navy.Class('Foo.Bar.ClassA', {});

  it('can access constructor', function() {
    var a = new Foo.Bar.ClassA();

    expect(a.$class).toBe(Foo.Bar.ClassA);
  });

  it('can access class name', function() {
    var a = new Foo.Bar.ClassA();

    expect(a.$className).toBe('Foo.Bar.ClassA');
  });

  it('can access constructor function name', function() {
    expect(Foo.Bar.ClassA.name).toBe('Foo$Bar$ClassA');
  });
});

describe('Navy.Class static property and method', function() {
  /**
   * @class ClassC
   */
  Navy.Class('ClassC', {
    $static: {
      value: {x: 10},

      getValue: function(){
        return this.value;
      },

      setValue: function(x) {
        this.value.x = x;
      }
    }
  });

  it('has static property', function() {
    var a1 = new ClassC();
    var a2 = new ClassC();

    expect(a1.$class.x).toBe(ClassC.x);
    expect(a2.$class.x).toBe(ClassC.x);
  });

  it('call static method', function() {
    var a1 = new ClassC();
    var a2 = new ClassC();

    ClassC.setValue(100);
    expect(a1.$class.getValue()).toBe(ClassC.getValue());
    expect(a2.$class.getValue()).toBe(ClassC.getValue());
  });
});

describe('Navy.Class exception', function() {
  it('throw property error when property is Object', function() {
    try {
      Navy.Class('ClassA', {
        obj: {}
      });
    } catch(e) {
      expect(true).toBeTruthy();
      return;
    }

    expect(true).toBeFalsy();
  });

  it('throw argument error when argument number is not enough', function() {
    try {
      Navy.Class();
    } catch(e) {
      expect(true).toBeTruthy();
    }

    try {
      Navy.Class('ClassA');
    } catch(e) {
      expect(true).toBeTruthy();
      return;
    }

    expect(true).toBeFalsy();
  });

  it('throws not function exception.', function(){
    var exception = null;
    try {
      Navy.Class._wrapFunction({doSomething: 'not function'}, 'doSomething', function(){});
    } catch(e) {
      exception = e;
    }

    expect(exception).not.toBeNull();
  });

  it('throws already defined exception.', function(){
    var exception = null;

    Navy.Class('ClassA5', {});
    try {
      Navy.Class('ClassA5', {});
    } catch(e) {
      exception = e;
    }

    expect(exception).not.toBeNull();
  });
});

describe('Navy.Class extend', function() {
  /**
   * @class classAA
   */
  Navy.Class('ClassAA', {
    x: 0,
    initialize: function(arg) {
      this.x = arg;
    },

    getX: function() {
      return this.x;
    },

    say: function() {
      return 'ClassA';
    }
  });

  /**
   * @class classBB
   */
  Navy.Class('ClassBB', ClassAA, {
    initialize: function($super, arg) {
      $super(arg);
    },

    say: function($super) {
      var result = $super();
      return result + ':ClassB';
    }
  });

  it('extend class', function() {
    var b = new ClassBB();

    expect(b instanceof ClassBB).toBeTruthy();
    expect(b instanceof ClassAA).toBeTruthy();
  });

  it('can override initialize method', function() {
    var value = {num: 10};
    var b = new ClassBB(value);

    expect(b.x).toBe(value);
  });

  it('can extend method', function() {
    var value = {num: 10};
    var b = new ClassBB(value);

    expect(b.getX()).toBe(value);
  });

  it('can override method', function() {
    var b = new ClassBB();

    expect(b.say()).toBe('ClassA:ClassB');
  });
});

describe('Navy.Class extend static', function() {
  /**
   * @class ClassAAA
   */
  Navy.Class('ClassAAA', {
    $static: {
      say: function() {
        return 'ClassA';
      }
    }
  });

  Navy.Class('ClassBBB', ClassAAA, {
    $static: {
      say: function($super) {
        return $super() + ':ClassB';
      }
    }
  });

  it('can override method', function() {
    expect(ClassBBB.say()).toBe('ClassA:ClassB');
  });
});

describe('Navy.Class.instance create singleton instance:', function(){
  /**
   * @typedef {Object} Instance1
   */
  Navy.Class.instance('Instance1', {
    getName: function() {
      return 'Instance1';
    }
  });

  /**
   * @class Class4
   */
  Navy.Class('Class4', Instance1, {
    getName: function($super) {
      return $super() + ':Class4';
    }
  });

  it('can be used like singleton.', function(){
    expect(Instance1.getName()).toBe('Instance1');
  });

  it('can extend singleton instance', function(){
    var obj = new Class4();
    expect(obj.getName()).toBe('Instance1:Class4');
  });
});
