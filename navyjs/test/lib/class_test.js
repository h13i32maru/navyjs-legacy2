buster.testCase('Navy.Class simple class', {
  setUp: function() {
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
  },

  'test class instanceof': function() {
    var a = new ClassA();
    var b = new ClassB();

    buster.assert.isTrue(a instanceof ClassA);
    buster.assert.isFalse(b instanceof ClassA);
  },

  'test initialize function': function() {
    var arg1 = 100;
    var arg2 = [-1, -2];
    var a = new ClassA(arg1, arg2);

    buster.assert.equals(a.arg1, arg1);
    buster.assert.same(a.arg2, arg2);
  },

  'test method': function() {
    var a = new ClassA();
    buster.assert.equals(a.say(), 'ClassA#say');
  },

  'test property': function() {
    var a1 = new ClassA();
    var a2 = new ClassA();

    a1.obj['food'] = 'rice';

    buster.assert.equals(a1.obj['food'], 'rice');
    buster.refute.defined(a2.obj['food']);
    buster.refute.same(a1.obj, a2.obj);
  }
});

buster.testCase('Navy.Class special property', {
  setUp: function() {
    /**
     * @class Foo.Bar.ClassA
     */
    Navy.Class('Foo.Bar.ClassA', {});
  },

  'test access constructor': function() {
    var a = new Foo.Bar.ClassA();

    buster.assert.same(a.$class, Foo.Bar.ClassA);
  },

  'test class name': function() {
    var a = new Foo.Bar.ClassA();

    buster.assert.same(a.$className, 'Foo.Bar.ClassA');
  },

  'test constructor function name': function() {
    buster.assert.same(Foo.Bar.ClassA.name, 'Foo$Bar$ClassA');
  }
});

buster.testCase('Navy.Class static property and method', {
  setUp: function() {
    /**
     * @class ClassA
     */
    Navy.Class('ClassA', {
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
  },

  'test static property': function() {
    var a1 = new ClassA();
    var a2 = new ClassA();

    buster.assert.same(a1.$class.x, ClassA.x);
    buster.assert.same(a2.$class.x, ClassA.x);
  },

  'test static method': function() {
    var a1 = new ClassA();
    var a2 = new ClassA();

    ClassA.setValue(100);
    buster.assert.same(a1.$class.getValue(), ClassA.getValue());
    buster.assert.same(a2.$class.getValue(), ClassA.getValue());
  }
});

buster.testCase('Navy.Class exception', {
  'test property error': function() {
    try {
      Navy.Class('ClassA', {
        obj: {}
      });
    } catch(e) {
      buster.assert(true);
      return;
    }

    buster.assert(false);
  },

  'test argument error': function() {
    try {
      Navy.Class();
      Navy.Class('ClassA');
    } catch(e) {
      buster.assert(true);
      return;
    }

    buster.assert(false);
  }
});

buster.testCase('Navy.Class extend', {
  setUp: function() {
    Navy.Class('ClassA', {
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

    Navy.Class('ClassB', ClassA, {
      initialize: function($super, arg) {
        $super(arg);
      },

      say: function($super) {
        var result = $super();
        return result + ':ClassB';
      }
    });
  },

  'test instance type': function() {
    var b = new ClassB();

    buster.assert(b instanceof ClassB);
    buster.assert(b instanceof ClassA);
  },

  'test override initialize method': function() {
    var value = {num: 10};
    var b = new ClassB(value);

    buster.assert.same(b.x, value);
  },

  'test extend method': function() {
    var value = {num: 10};
    var b = new ClassB(value);

    buster.assert.same(b.getX(), value);
  },

  'test override method': function() {
    var b = new ClassB();

    buster.assert.same(b.say(), 'ClassA:ClassB');
  }
});

buster.testCase('Navy.Class extend static', {
  setUp: function() {
    /**
     * @class ClassA
     */
    Navy.Class('ClassA', {
      $static: {
        say: function() {
          return 'ClassA';
        }
      }
    });

    Navy.Class('ClassB', ClassA, {
      $static: {
        say: function($super) {
          return $super() + ':ClassB';
        }
      }
    });
  },

  'test override method': function() {
    buster.assert.same(ClassB.say(), 'ClassA:ClassB');
  }
});
