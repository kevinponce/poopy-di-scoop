import Parse from '../src/parse';
import Project from '../src/project';
import Component from '../src/component';
import assert from 'assert';

const TEST = 'test';

describe('Parse', () => {
  describe('build', () => {
    it("tag: a", () => {
      var parse = new Parse('<a href="#" class="hi mom">test</a>', {}).build();
      assert.equal(parse.tags.length, 1);

      let tag = parse.tags[0];
      assert.equal(tag.name, "a");
      assert.equal(tag.attrs.length, 2);
      assert.equal(tag.attrs[0].key, "href");
      assert.equal(tag.attrs[0].value, "#");
      assert.equal(tag.attrs[1].key, "class");
      assert.equal(tag.attrs[1].value, "hi mom");
      assert.equal(tag.endAt, 35);
      assert.equal(tag.closed, true);
      assert.equal(tag.selfClosing, false);
    });

    it("children", () => {
      var parse = new Parse('<ul><li>1</li><li>2</li><li>3</li></ul>', {}).build();
      assert.equal(parse.tags.length, 1);

      let tag = parse.tags[0];
      assert.equal(tag.name, "ul");
      assert.equal(tag.attrs.length, 0);
      assert.equal(tag.children.length, 3);
      assert.equal(tag.endAt, 39);
      assert.equal(tag.closed, true);
      assert.equal(tag.selfClosing, false);

      assert.equal(tag.children[0].name, 'li');
      assert.equal(tag.children[1].name, 'li');
      assert.equal(tag.children[2].name, 'li');

      assert.equal(tag.children[0].children.length, 1);
      assert.equal(tag.children[0].children[0], '1');

      assert.equal(tag.children[1].children.length, 1);
      assert.equal(tag.children[1].children[0], '2');

      assert.equal(tag.children[2].children.length, 1);
      assert.equal(tag.children[2].children[0], '3');
    });

    it("tag: input, attr: value", () => {
      var parse = new Parse('<input value="submit" required/>', {}).build();
      assert.equal(parse.tags.length, 1);

      let tag = parse.tags[0];
      assert.equal(tag.name, "input");
      assert.equal(tag.attrs.length, 2);
      assert.equal(tag.closed, true);
      assert.equal(tag.selfClosing, true);

      assert.equal(tag.attrs[0].key, "value");
      assert.equal(tag.attrs[0].value, "submit");

      assert.equal(tag.attrs[1].key, "required");
      assert.equal(tag.attrs[1].value, null);
    });
  });

  describe('dependencies', () => {
    it("dependency li", () => {
      var parse = new Parse('<ul><li>1</li><li>2</li><li>3</li></ul>', {}).build();
      assert.equal(parse.dependencies().length, 2);
      assert.deepEqual(parse.dependencies(), ['ul', 'li']);
    });

    it("nested dependencies: li a", () => {
      var parse = new Parse('<ul><li><a>1</a></li><li><a>2</a></li><li><a>3</a></li></ul>', {}).build();
      assert.equal(parse.dependencies().length, 3);
      assert.deepEqual(parse.dependencies(), ['ul', 'li', 'a']);
    });

    it("dependencies: nav, h3, footer", () => {
      var parse = new Parse('<div><nav/><h3>Hello wolrd</h3><footer/></div>', {}).build();
      assert.equal(parse.dependencies().length, 4);
      assert.deepEqual(parse.dependencies(), ['div', 'nav', 'h3', 'footer']);
    });
  });

  describe("buildParams", () => {
    it("hello", () => {
      var parse = new Parse('<div>{hello} world</div>', {}).build();
      assert.deepEqual(Object.keys(parse.buildParams()), ['hello']);
      assert.equal(parse.buildParams().hello, 'string');
    });

    it("hello, name", () => {
      var parse = new Parse('<div>{hello} world <p>What is your {name}</p></div>', {}).build();
      assert.deepEqual(parse.buildParams(), { 'hello': 'string', 'name': 'string' });
    });

    it("user nested params in string", () => {
      var parse = new Parse('<div>Hi my name is {user.name}! I am {user.age} and live in {user.address.country}</div>', {}).build();
      assert.deepEqual(parse.buildParams(), { 'user': { 'name': 'string', 'age': 'string', 'address': { 'country': 'string' } } });
    });

    it("user nested params in children", () => {
      var parse = new Parse('<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>', {}).build();
      assert.deepEqual(parse.buildParams(), { 'user': { 'name': 'string', 'age': 'string', 'address': { 'country': 'string' } } });
    });

    describe('each', () => {
      it("numbers in div", () => {
        var parse = new Parse('<div each="number in numbers">{number}</div>', {}).build();
        assert.deepEqual(parse.buildParams(), { 'numbers': ['string'] });
      });

      it("nested numbers", () => {
        var parse = new Parse('<ul><li each="number in numbers">{number}</li></ul>', {}).build();
        assert.deepEqual(parse.buildParams(), { 'numbers': ['string'] });
      });

      it("links", () => {
        var parse = new Parse('<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>', {}).build();
        assert.deepEqual(parse.buildParams(), { 'links': [{ 'href': 'string', 'title': 'string' }] });
      });
    });
  });

  describe("buildArrayParams", () => {
    it("hello", () => {
      var parse = new Parse('<div>{hello} world</div>', {}).build();
      assert.deepEqual(parse.buildArrayParams(), [{ path: 'hello', value: 'string' }]);
    });

    it("hello, name", () => {
      var parse = new Parse('<div>{hello} world <p>What is your {name}</p></div>', {}).build();
      assert.deepEqual(parse.buildArrayParams(), [{ path: 'hello', value: 'string' }, { path: 'name', value: 'string' }]);
    });

    it("user nested params in string", () => {
      var parse = new Parse('<div>Hi my name is {user.name}! I am {user.age} and live in {user.address.country}</div>', {}).build();
      assert.deepEqual(parse.buildArrayParams(), [{
        path: 'user.name', value: 'string'
      }, {
        path: 'user.age', value: 'string'
      }, {
        path: 'user.address.country', value: 'string'
      }]);
    });

    it("user nested params in children", () => {
      var parse = new Parse('<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>', {}).build();
      assert.deepEqual(parse.buildArrayParams(), [{
        path: 'user.name', value: 'string'
      }, {
        path: 'user.age', value: 'string'
      }, {
        path: 'user.address.country', value: 'string'
      }]);
    });

    describe('each', () => {
      it("numbers in div", () => {
        var parse = new Parse('<div each="number in numbers">{number}</div>', {}).build();
        assert.deepEqual(parse.buildArrayParams(), [{ path: 'numbers.0', value: 'string' }]);
      });

      it("nested numbers", () => {
        var parse = new Parse('<ul><li each="number in numbers">{number}</li></ul>', {}).build();
        assert.deepEqual(parse.buildArrayParams(), [{ path: 'numbers.0', value: 'string' }]);
      });

      it("links", () => {
        var parse = new Parse('<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>', {}).build();
        assert.deepEqual(parse.buildArrayParams(), [{
          path: 'links.0.href', value: 'string'
        }, {
          path: 'links.0.title', value: 'string'
        }]);
      });
    });
  });

  describe("loadComponents", () => {
    var project = new Project()
    project.load(new Component({ name: 'nav', html: '<ul class="header"><li>1</li><li>2</li></ul>' }).build());
    project.load(new Component({ name: 'parent', html: '<div id="test">{children}</div>' }).build());
    project.build();

    it("simple", () => {
      var parse = new Parse('<div class="hello-world">hello world</div>', {}).build();
      assert.equal(!!parse.loadComponents(project), true);
    });

    it("child", () => {
      var parse = new Parse('<div><h3></h3></div>', {}).build();
      assert.equal(!!parse.loadComponents(project), true);
    });

    it("nav", () => {
      var parse = new Parse('<nav id="test"/>', {}).build();
      assert.equal(!!parse.loadComponents(project), true);
    });

    it("nav wrapped", () => {
      var parse = new Parse('<div><nav id="test"/></div>', {}).build();
      assert.equal(!!parse.loadComponents(project), true);
    });

    it("parent nav", () => {
      var parse = new Parse('<parent><nav id="test"/></parent>', {}).build();
      assert.equal(!!parse.loadComponents(project), true);
    });
  });

  describe("toHtml", () => {
    describe('no params', () => {
      it("simple", () => {
        let html = '<div class="hello-world">hello world</div>';
        var parse = new Parse(html, {}).build();
        assert.equal(parse.toHtml({ fmt: TEST }), html);
      });

      it("with children", () => {
        let html = '<div class="hello-world"><b>hello</b><div><p>world</p></div></div>';
        var parse = new Parse(html, {}).build();
        assert.equal(parse.toHtml({ fmt: TEST }), html);
      });

      it("with children and random spaces", () => {
        let html = '   <div class="hello-world"><b>hello </b><div>    <p>world</p></div>  </div>';
        var parse = new Parse(html, { withWhiteSpace: true}).build();
        assert.equal(parse.toHtml({ htmlCheck: true, fmt: TEST }), html);
      });
    });

    describe("with params", () => {
      it("no found", () => {
        let html = '<div class="hello-world">{hello} world</div>';
        var parse = new Parse(html, {}).build();
        assert.equal(parse.toHtml({ params: { hola: 'hola' }, fmt: TEST }), html);
      });

      it("hello", () => {
        var parse = new Parse('<div class="hello-world">{hello} world</div>', {}).build();
        assert.equal(parse.toHtml({
          params: { hello: 'hola' },
          fmt: TEST
        }), '<div class="hello-world">hola world</div>');
      });

      it("with children", () => {
        var parse = new Parse('<div class="hello-world"><b>{hello}</b><div><p>{world}</p></div></div>', {}).build();
        assert.equal(parse.toHtml({
          params: { hello: 'hola', world: 'yes' },
          fmt: TEST
        }), '<div class="hello-world"><b>hola</b><div><p>yes</p></div></div>');
      });

      it("user nested params in children", () => {
        var parse = new Parse('<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>', {}).build();
        assert.equal(parse.toHtml({
          params: {
            'user': { 'name': 'kevin', 'age': '30', 'address': { 'country': 'usa' }}
          },
          fmt: TEST
        }), '<div>Hi my name is kevin! <div>I am 30 and live in <b>usa</b></div></div>');
      });

      it("nested numbers", () => {
        var parse = new Parse('<ul><li each="number in numbers">{number}</li></ul>', {}).build();
        assert.equal(parse.toHtml({
          params: { numbers: [1, 2, 3] },
          fmt: TEST
        }), "<ul><li>1</li><li>2</li><li>3</li></ul>");
      });

      it("links", () => {
        var parse = new Parse('<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>', {}).build();
        assert.equal(parse.toHtml({
          params: {
            links:[{ href: '#', title: 'home'}, { href: '/about', title: 'about' }]
          },
          fmt: TEST
        }), '<ul><li><a href="#">home</a></li><li><a href="/about">about</a></li></ul>');
      });
    });
  });
});
