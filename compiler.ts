/// <reference path="references.ts" />
declare var angular;
declare var isString;
declare var isFunction;
declare var assertArg;
declare var forEach;
declare var valueFn;
declare var reverseParams;
declare var $exceptionHandler;

interface HasDirectives {
  [name: string] : Array;
}

interface IDirective {
  public compile?: Function;
  link?: Function;
  priority?: number;
  name?: string;
  require?: boolean;
  restrict?: string;
  controller?: string;
}

class InjectableFunction  {
  constructor (dependencies: Array<string>, fn: Function) {
    var injectableFunction: Array<any> = dependencies;
    injectableFunction.push(fn);
    return injectableFunction;
  }
}

class Directive implements IDirective {
  public priority: number;
  public name: string;
  public require: boolean;
  public restrict: string;
  public controller: string;

  constructor(public compile: Function, public link: Function) {
    if (!compile && link) {
      this.compile = valueFn(link);
    }
  }

  setOptions (priority: number, name: string, require: boolean, restrict: string) {
    this.priority = priority || 0;
    this.name = name;
    this.require = require || (this.controller && this.name);
    this.restrict = restrict || 'A';
  }
}

interface List<T> {
  data: T;
  next: List<T>;

}

class $Compiler {
  private $provide: $Provider;
  private hasDirectives: HasDirectives = {};
  Suffix: string = 'Directive';

  constructor($provider: $Provider) {
    this.$provide = $provider;
  }

  directive(name: any, directiveFactory: Function) {
    if (angular.isString(name)) {
      assertArg(directiveFactory, 'directiveFactory');

      if (!this.hasDirectives.hasOwnProperty(name)) {
        this.hasDirectives[name] = [];

        this.$provide.factory(name + this.Suffix,
          new InjectableFunction(['$injector', '$exceptionHandler'], generateDirectives));

        function generateDirectives ($injector, $exceptionHandler) {
          var directives: Array<Directive> = [];

          for (var i = 0; i < this.hasDirectives[name].length; i++) {
            try {
              var directive: any = $injector.invoke(this.hasDirectives[name][i]);

              if (isFunction(directive) || (!directive.compile && directive.link)) {
                directive = <Directive> new Directive(null, directive.link ? directive.link : directive);
              }

              // directive.setOptions(directive.priority, directive.name, directive.require, directive.restrict);
              directive.setOptions(0, 'foo', 'bar', true);

              directives.push(directive);
            } catch (e) {
              $exceptionHandler(e);
            }
          }

          return directives;
        };
      }

      this.hasDirectives[name].push(directiveFactory);

    } else {
      forEach(name, reverseParams(this.directive));
    }

    return this;
  }
}

var provider = new $Provider();
var c = new $Compiler(provider);
