describe("Navy.Class is class base OOP:", function() {
  /**
   * @class Spec.ClassA
   */
  Navy.Class('Spec.ClassA', {
    $static: {
      say: function(){
        return 'ClassA.say';
      }
    },
    arg1: null,
    arg2: null,
    obj: null,
    x: 0,

    initialize: function(arg1, arg2) {
      this.arg1 = arg1;
      this.arg2 = arg2;

      this.obj = {};
    },

    say: function() {
      return 'ClassA#say';
    },

    getX: function() {
      return this.x;
    }
  });

  /**
   * @class Spec.ClassB
   */
  Navy.Class('Spec.ClassB', {
    say: function() {
      return 'ClassB#sayB';
    }
  });

  /**
   * @class Spec.ClassC
   */
  Navy.Class('Spec.ClassC', {
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

  /**
   * @class Spec.ClassAA
   */
  Navy.Class('Spec.ClassAA', Spec.ClassA, {
    $static: {
      say: function($super) {
        return $super() + ':ClassAA';
      }
    },

    initialize: function($super, arg1, arg2) {
      $super(arg1, arg2);
    },

    /**
     *
     * @param [$super]
     * @returns {string}
     */
    say: function($super) {
      var result = $super();
      return result + ':ClassB';
    }
  });

  /**
   * @typedef {Object} Spec.InstanceA
   */
  Navy.Class.instance('Spec.InstanceA', {
    getName: function() {
      return 'InstanceA';
    }
  });

  /**
   * @class Spec.ClassD
   */
  Navy.Class('Spec.ClassD', Spec.InstanceA, {
    getName: function($super) {
      return $super() + ':ClassD';
    }
  });

  describe('Simple usage:', function(){
    it('created constructor function.', function(){
      expect(typeof Spec.ClassA).toBe('function');
      expect(typeof Spec.ClassB).toBe('function');
    });

    it("create instance.", function() {
      var a = new Spec.ClassA();
      var b = new Spec.ClassB();

      expect(a instanceof Spec.ClassA).toBeTruthy();
      expect(b instanceof Spec.ClassB).toBeTruthy();
    });

    it('initialize function is called when use "new"', function() {
      var arg1 = 100;
      var arg2 = [-1, -2];
      var a = new Spec.ClassA(arg1, arg2);

      expect(a.arg1).toBe(arg1);
      expect(a.arg2).toBe(arg2);
    });

    it('can call method', function() {
      var a = new Spec.ClassA();
      expect(a.say()).toBe('ClassA#say');
    });

    it('each instance property are independence.', function() {
      var a1 = new Spec.ClassA();
      var a2 = new Spec.ClassA();

      a1.obj['food'] = 'rice';

      expect(a1.obj['food']).toBe('rice');
      expect(a2.obj['food']).toBeUndefined();
      expect(a1.obj).not.toBe(a2.obj);
    });
  });

  describe('Special property:', function(){
    it('can access constructor', function() {
      var a = new Spec.ClassA();

      expect(a.$class).toBe(Spec.ClassA);
    });

    it('can access class name', function() {
      var a = new Spec.ClassA();

      expect(a.$className).toBe('Spec.ClassA');
    });

    it('can access constructor function name', function() {
      expect(Spec.ClassA.name).toBe('Spec$ClassA');
    });
  });

  describe('Static property and method:', function() {
    it('has static property', function() {
      var a1 = new Spec.ClassC();
      var a2 = new Spec.ClassC();

      expect(a1.$class.x).toBe(Spec.ClassC.x);
      expect(a2.$class.x).toBe(Spec.ClassC.x);
    });

    it('call static method', function() {
      var a1 = new Spec.ClassC();
      var a2 = new Spec.ClassC();

      Spec.ClassC.setValue(100);
      expect(a1.$class.getValue()).toBe(Spec.ClassC.getValue());
      expect(a2.$class.getValue()).toBe(Spec.ClassC.getValue());
    });
  });

  describe('Extend class:', function() {

    it('extend class', function() {
      var a = new Spec.ClassAA();

      expect(a instanceof Spec.ClassAA).toBeTruthy();
      expect(a instanceof Spec.ClassA).toBeTruthy();
    });

    it('can override initialize method', function() {
      var a = new Spec.ClassAA(10, 20);

      expect(a.arg1).toBe(10);
      expect(a.arg2).toBe(20);
    });

    it('can extend method', function() {
      var a = new Spec.ClassAA(10, 20);

      expect(a.getX()).toBe(0);
    });

    it('can override method', function() {
      var a = new Spec.ClassAA();

      expect(a.say()).toBe('ClassA#say:ClassB');
    });
  });

  describe('Extend class that has static method:', function() {
    it('can override method', function() {
      expect(Spec.ClassAA.say()).toBe('ClassA.say:ClassAA');
    });
  });

  describe('Create singleton instance:', function(){

    it('can be used like singleton.', function(){
      expect(Spec.InstanceA.getName()).toBe('InstanceA');
    });

    it('can extend singleton instance', function(){
      var obj = new Spec.ClassD();
      expect(obj.getName()).toBe('InstanceA:ClassD');
    });
  });

  describe('Error occurs:', function() {
    it('throw property error when property is Object', function() {
      var exception;
      try {
        Navy.Class('Spec.ClassX', {
          obj: {}
        });
      } catch(e) {
        exception = e;
      }

      expect(exception.message).toContain('object property must be primitive type.');
    });

    it('throw argument error when argument number is not enough', function() {
      var exception;
      try {
        Navy.Class();
      } catch(e) {
        exception = e;
      }
      expect(exception.message).toContain('arguments of Navy.Class is 2 or 3.');

      try {
        Navy.Class('ClassA');
      } catch(e) {
        exception = e;
      }

      expect(exception.message).toContain('arguments of Navy.Class is 2 or 3.');
    });

    it('throws not function exception.', function(){
      var exception;
      try {
        Navy.Class._wrapFunction({doSomething: 'not function'}, 'doSomething', function(){});
      } catch(e) {
        exception = e;
      }

      expect(exception.message).toContain('override method must be function');
    });

    it('throws already defined exception.', function(){
      var exception;

      try {
        Navy.Class('Spec.ClassA', {});
      } catch(e) {
        exception = e;
      }

      expect(exception.message).toContain('already defined this className');
    });
  });
});
