import Component from '../src/component';
import Project from '../src/project';
import assert from 'assert';

describe('Component', () => {
  describe('build', () => {
    it("tag: a", () => {
      var component = new Component({ name: 'link', html: '<a href="#" class="hi mom">test</a>' }).build();
      assert.equal(component.name, "link");
      assert.deepEqual(component.dependencies, ["a"]);
      assert.equal(!!component.parse, true);
    });

    it("children", () => {
      var component = new Component({ name: 'nav', html: '<ul><li>1</li><li>2</li><li>3</li></ul>' }).build();
      assert.equal(component.name, "nav");
      assert.deepEqual(component.dependencies, ["ul", "li"]);
      assert.equal(!!component.parse, true);
    });

    it("tag: input, attr: value", () => {
      var component = new Component({ name: 'submit', html: '<input value="submit" required/>' }).build();
      assert.equal(component.name, "submit");
      assert.deepEqual(component.dependencies, ["input"]);
      assert.equal(!!component.parse, true);
    });

    it("with child that is self closing", () => {
      var component = new Component({ name: 'yes', html: '<div><circular2 /></div>' }).build();
      assert.equal(component.name, "yes");
      assert.deepEqual(component.dependencies, ["div", "circular2"]);
      assert.equal(!!component.parse, true);
    });
  });

  describe("loadComponents", () => {
    var project = new Project()
    project.load(new Component({ name: 'nav', html: '<ul class="header"><li>1</li><li>2</li></ul>' }).build());
    project.load(new Component({ name: 'parent', html: '<div id="test">{children}</div>' }).build());
    project.build();

    it("simple", () => {
      var component = new Component({ name: "simple", html: '<div>Hi mom</div>'}).build();

      assert.equal(!!component.loadComponents(project), true);
    });

    it("child", () => {
      var component = new Component({ name: "child", html: '<div><h3></h3></div>'}).build();

      assert.equal(!!component.loadComponents(project), true);
    });

    it("nav", () => {
      var component = new Component({ name: "nav", html: '<nav id="test"/>'}).build();

      assert.equal(!!component.loadComponents(project), true);
    });

    it("nav wrapped", () => {
      var component = new Component({ name: "nav@rapped", html: '<div><nav id="test"/></div>'}).build();

      assert.equal(!!component.loadComponents(project), true);
    });

    it("parent nav", () => {
      var component = new Component({ name: "nav@rapped", html: '<parent><nav id="test"/></parent>'}).build();

      assert.equal(!!component.loadComponents(project), true);
    });
  });

  describe("toHtml", () => {
    describe('no params', () => {
      it("simple", () => {
        let html = '<div class="hello-world">hello world</div>';
        var component = new Component({ name: 'noParams', html: html }).build();
        assert.equal(component.toHtml({}), html);
      });

      it("with children", () => {
        let html = '<div class="hello-world"><b>hello</b><div><p>world</p></div></div>';
        var component = new Component({ name: 'withChildren', html: html }).build();
        assert.equal(component.toHtml({}), html);
      });
    });

    describe("with params", () => {
      it("no found", () => {
        let html = '<div class="hello-world">{hello} world</div>';
        var component = new Component({ name: 'withParams', html: html }).build();
        assert.equal(component.toHtml({ params: { hola: 'hola' } }), html);
      });

      it("hello", () => {
        var component = new Component({ name: 'hello', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.equal(component.toHtml({ params: { hello: 'hola' } }), '<div class="hello-world">hola world</div>');
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>{hello}</b><div><p>{world}</p></div></div>' }).build();
        assert.equal(component.toHtml({ params: { hello: 'hola', world: 'yes' } }), '<div class="hello-world"><b>hola</b><div><p>yes</p></div></div>');
      });

      it("user nested params in children", () => {
        var component = new Component({ name: 'userNestedParamsInchildren', html: '<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>' }).build();

        assert.equal(component.toHtml({ params: {
          'user': { 'name': 'kevin', 'age': '30', 'address': { 'country': 'usa' } }
        }}), '<div>Hi my name is kevin! <div>I am 30 and live in <b>usa</b></div></div>');
      });

      it("nested numbers", () => {
        var component = new Component({ name: 'nestedNumbers', html: '<ul><li each="number in numbers">{number}</li></ul>' }).build();
        assert.equal(component.toHtml({ params: { numbers: [1, 2, 3]} }), "<ul><li>1</li><li>2</li><li>3</li></ul>");
      });

      it("links", () => {
        var component = new Component({ name: 'links', html: '<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>' }).build();
        assert.equal(component.toHtml({ params: {
          links:[{ href: '#', title: 'home'}, { href: '/about', title: 'about' }] }
        }), '<ul><li><a href="#">home</a></li><li><a href="/about">about</a></li></ul>');
      });
    });
  });

  describe("paramsStructure", () => {
    describe('no params', () => {
      it("simple", () => {
        var component = new Component({ name: 'noParams', html: '<div class="hello-world">hello world</div>' }).build();
        assert.deepEqual(component.paramsStructure(), {});
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>hello</b><div><p>world</p></div></div>' }).build();
        assert.deepEqual(component.paramsStructure(), {});
      });
    });

    describe("with params", () => {
      it("no found", () => {
        var component = new Component({ name: 'withParams', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.deepEqual(component.paramsStructure(), { hello: 'string' });
      });

      it("hello", () => {
        var component = new Component({ name: 'hello', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.deepEqual(component.paramsStructure(), { hello: 'string' });
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>{hello}</b><div><p>{world}</p></div></div>' }).build();
        assert.deepEqual(component.paramsStructure(), { hello: 'string', world: 'string' });
      });

      it("user nested params in children", () => {
        var component = new Component({ name: 'userNestedParamsInchildren', html: '<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>' }).build();

        assert.deepEqual(component.paramsStructure(), {
          user: {
            name: 'string',
            age: 'string',
            address: {
              country: 'string'
            }
          }
        });
      });

      it("nested numbers", () => {
        var component = new Component({ name: 'nestedNumbers', html: '<ul><li each="number in numbers">{number}</li></ul>' }).build();
        assert.deepEqual(component.paramsStructure(), { numbers: ['string'] });
      });

      it("links", () => {
        var component = new Component({ name: 'links', html: '<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>' }).build();
        assert.deepEqual(component.paramsStructure(), {
          links: [{
            title: 'string',
            href: 'string'
          }]
        });
      });

    });
  });

  describe("buildDefaultParams", () => {
    describe('no params', () => {
      it("simple", () => {
        var component = new Component({ name: 'noParams', html: '<div class="hello-world">hello world</div>' }).build();
        assert.deepEqual(component.buildDefaultParams(), {});
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>hello</b><div><p>world</p></div></div>' }).build();
        assert.deepEqual(component.buildDefaultParams(), {});
      });
    });

    describe("with params", () => {
      it("no found", () => {
        var component = new Component({ name: 'withParams', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.deepEqual(component.buildDefaultParams(), { hello: '' });
      });

      it("hello", () => {
        var component = new Component({ name: 'hello', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.deepEqual(component.buildDefaultParams(), { hello: '' });
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>{hello}</b><div><p>{world}</p></div></div>' }).build();
        assert.deepEqual(component.buildDefaultParams(), { hello: '', world: '' });
      });

      it("user nested params in children", () => {
        var component = new Component({ name: 'userNestedParamsInchildren', html: '<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>' }).build();

        assert.deepEqual(component.buildDefaultParams(), {
          user: {
            name: '',
            age: '',
            address: {
              country: ''
            }
          }
        });
      });

      it("nested numbers", () => {
        var component = new Component({ name: 'nestedNumbers', html: '<ul><li each="number in numbers">{number}</li></ul>' }).build();
        assert.deepEqual(component.buildDefaultParams(), { numbers: [] });
      });

      it("links", () => {
        var component = new Component({ name: 'links', html: '<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>' }).build();
        assert.deepEqual(component.buildDefaultParams(), {
          links: []
        });
      });

    });
  });

  describe("buildArrayParams", () => {
    describe('no params', () => {
      it("simple", () => {
        var component = new Component({ name: 'noParams', html: '<div class="hello-world">hello world</div>' }).build();
        assert.deepEqual(component.buildArrayParams(), []);
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>hello</b><div><p>world</p></div></div>' }).build();
        assert.deepEqual(component.buildArrayParams(), []);
      });
    });

    describe("with params", () => {
      it("no found", () => {
        var component = new Component({ name: 'withParams', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.deepEqual(component.buildArrayParams(), [{ path: 'hello', value: 'string' }]);
      });

      it("hello", () => {
        var component = new Component({ name: 'hello', html: '<div class="hello-world">{hello} world</div>' }).build();
        assert.deepEqual(component.buildArrayParams(), [{ path: 'hello', value: 'string' }]);
      });

      it("with children", () => {
        var component = new Component({ name: 'withChildren', html: '<div class="hello-world"><b>{hello}</b><div><p>{world}</p></div></div>' }).build();
        assert.deepEqual(component.buildArrayParams(), [{
          path: 'hello', value: 'string'
        }, {
          path: 'world', value: 'string'
        }]);
      });

      it("user nested params in children", () => {
        var component = new Component({ name: 'userNestedParamsInchildren', html: '<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>' }).build();

        assert.deepEqual(component.buildArrayParams(), [{
          path: 'user.name', value: 'string'
        }, {
          path: 'user.age', value: 'string'
        }, {
          path: 'user.address.country', value: 'string'
        }]);
      });

      it("nested numbers", () => {
        var component = new Component({ name: 'nestedNumbers', html: '<ul><li each="number in numbers">{number}</li></ul>' }).build();
        assert.deepEqual(component.buildArrayParams(), [{
          path: 'numbers.0', value: 'string'
        }]);
      });

      it("links", () => {
        var component = new Component({ name: 'links', html: '<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>' }).build();
        assert.deepEqual(component.buildArrayParams(), [{
          path: 'links.0.href', value: 'string'
        }, {
          path: 'links.0.title', value: 'string'
        }]);
      });
    });
  });
});
