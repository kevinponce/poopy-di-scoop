import Tag from '../src/tag';
import Project from '../src/project';
import Component from '../src/component';
import assert from 'assert';

describe('Tag', () => {
  describe('build', () => {
    it("tag: a", () => {
      var tag = new Tag('<a href="#" class="hi mom">test</a>', { start: 0 }).build();
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
      var tag = new Tag('<ul><li>1</li><li>2</li><li>3</li></ul>', { start: 0 }).build();
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
      var tag = new Tag('<input value="submit" required/>', { start: 0 }).build();
      assert.equal(tag.name, "input");
      assert.equal(tag.attrs.length, 2);
      assert.equal(tag.closed, true);
      assert.equal(tag.selfClosing, true);

      assert.equal(tag.attrs[0].key, "value");
      assert.equal(tag.attrs[0].value, "submit");

      assert.equal(tag.attrs[1].key, "required");
      assert.equal(tag.attrs[1].value, null);
    });

    it("with child that is self closing", () => {
      var tag = new Tag('<div><circular2 /></div>', {}).build();

      assert.equal(tag.name, "div");
      assert.equal(tag.attrs.length, 0);
      assert.equal(tag.closed, true);
      assert.equal(tag.selfClosing, false);

      assert.equal(tag.children.length, 1);
      assert.equal(tag.children[0].name, 'circular2');
      assert.equal(tag.children[0].closed, true);
      assert.equal(tag.children[0].selfClosing, true);
    });
  });

  describe('dependencies', () => {
    it("dependency li", () => {
      var tag = new Tag('<ul><li>1</li><li>2</li><li>3</li></ul>', { start: 0 }).build();
      assert.equal(tag.dependencies().length, 1);
      assert.equal(tag.dependencies().includes('li'), true);
    });

    it("nested dependencies: li a", () => {
      var tag = new Tag('<ul><li><a>1</a></li><li><a>2</a></li><li><a>3</a></li></ul>', { start: 0 }).build();
      assert.equal(tag.dependencies().length, 2);
      assert.deepEqual(tag.dependencies(), ['li', 'a']);
    });

    it("dependencies: nav, h3, footer", () => {
      var tag = new Tag('<div><nav/><h3>Hello wolrd</h3><footer/></div>', { start: 0 }).build();
      assert.equal(tag.dependencies().length, 3);
      assert.deepEqual(tag.dependencies(), ['nav', 'h3', 'footer']);
    });
  });

  describe("loadComponents", () => {
    it("simple with empty project", () => {
      var project = new Project().build();
      var tag = new Tag('<a href="#" class="hi mom">test</a>', { start: 0 }).build();

      assert.equal(!!tag.loadComponents(project), true);
    });

    it("simple", () => {
      var project = new Project()
      var nav = new Component({ name: 'nav', html: '<ul class="header"><li>1</li><li>2</li></ul>' }).build();
      project.load(nav);

      project.build();
      var tag = new Tag('<nav id="test"/>', { start: 0 }).build();
      var newTag = tag.loadComponents(project);
      var attrNames = newTag.attrs.map((attr) => attr.key)

      assert.equal(!!newTag, true);
      assert.equal(newTag.attrs.length, 2);
      assert.equal(attrNames.includes('class'), true);
      assert.equal(attrNames.includes('id'), true);
      assert.equal(attrNames.includes('required'), false);
    });

    it("children", () => {
      var project = new Project()
      var parent = new Component({ name: 'parent', html: '<div id="test">{children}</div>' }).build();
      project.load(parent);

      project.build();
      var tag = new Tag('<parent><h3>Hi mom</h3></parent>', { start: 0 }).build();
      var newTag = tag.loadComponents(project);
      var attrNames = newTag.attrs.map((attr) => attr.key)

      assert.equal(!!newTag, true);
      assert.equal(newTag.attrs.length, 1);
      assert.equal(attrNames.includes('id'), true);
      assert.equal(attrNames.includes('class'), false);

      assert.equal(newTag.nestChildren.length, 1);
      assert.equal(newTag.children.length, 1);
    });
  });

  describe("buildParams", () => {
    it("hello", () => {
      var tag = new Tag('<div>{hello} world</div>', {}).build();
      assert.deepEqual(Object.keys(tag.buildParams()), ['hello']);
      assert.equal(tag.buildParams().hello, 'string');
    });

    it("hello, name", () => {
      var tag = new Tag('<div>{hello} world <p>What is your {name}</p></div>', {}).build();
      assert.deepEqual(tag.buildParams(), { 'hello': 'string', 'name': 'string' });
    });

    it("user nested params in string", () => {
      var tag = new Tag('<div>Hi my name is {user.name}! I am {user.age} and live in {user.address.country}</div>', {}).build();
      assert.deepEqual(tag.buildParams(), { 'user': { 'name': 'string', 'age': 'string', 'address': { 'country': 'string' } } });
    });

    it("user nested params in children", () => {
      var tag = new Tag('<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>', {}).build();
      assert.deepEqual(tag.buildParams(), { 'user': { 'name': 'string', 'age': 'string', 'address': { 'country': 'string' } } });
    });

    describe('each', () => {
      it("numbers in div", () => {
        var tag = new Tag('<div each="number in numbers">{number}</div>', {}).build();
        assert.deepEqual(tag.buildParams(), { 'numbers': ['string'] });
      });

      it("nested numbers", () => {
        var tag = new Tag('<ul><li each="number in numbers">{number}</li></ul>', {}).build();
        assert.deepEqual(tag.buildParams(), { 'numbers': ['string'] });
      });

      it("links", () => {
        var tag = new Tag('<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>', {}).build();
        assert.deepEqual(tag.buildParams(), { 'links': [{ 'href': 'string', 'title': 'string' }] });
      });
    });
  });

  describe("toHtml", () => {
    describe('no params', () => {
      it("simple", () => {
        let html = '<div class="hello-world">hello world</div>';
        var tag = new Tag(html, {}).build();
        assert.equal(tag.toHtml({}), html);
      });

      it("with children", () => {
        let html = '<div class="hello-world"><b>hello</b><div><p>world</p></div></div>';
        var tag = new Tag(html, {}).build();
        assert.equal(tag.toHtml({}), html);
      });

      it("with children and random spaces", () => {
        let html = '   <div class="hello-world"><b>hello </b><div>    <p>world</p></div>  </div>';
        var tag = new Tag(html, { withWhiteSpace: true}).build();
        assert.equal(tag.toHtml({ htmlCheck: true }), html);
      });
    });

    describe("with params", () => {
      it("no found", () => {
        let html = '<div class="hello-world">{hello} world</div>';
        var tag = new Tag(html, {}).build();
        assert.equal(tag.toHtml({ params: { hola: 'hola' } }), html);
      });

      it("hello", () => {
        var tag = new Tag('<div class="hello-world">{hello} world</div>', {}).build();
        assert.equal(tag.toHtml({ params: { hello: 'hola' } }), '<div class="hello-world">hola world</div>');
      });

      it("with children", () => {
        var tag = new Tag('<div class="hello-world"><b>{hello}</b><div><p>{world}</p></div></div>', {}).build();
        assert.equal(tag.toHtml({ params: { hello: 'hola', world: 'yes' } }), '<div class="hello-world"><b>hola</b><div><p>yes</p></div></div>');
      });

      it("user nested params in children", () => {
        var tag = new Tag('<div>Hi my name is {user.name}! <div>I am {user.age} and live in <b>{user.address.country}</b></div></div>', {}).build();
        assert.equal(tag.toHtml({ params: {
          'user': { 'name': 'kevin', 'age': '30', 'address': { 'country': 'usa' } }
        }}), '<div>Hi my name is kevin! <div>I am 30 and live in <b>usa</b></div></div>');
      });

      it("nested numbers", () => {
        var tag = new Tag('<ul><li each="number in numbers">{number}</li></ul>', {}).build();
        assert.equal(tag.toHtml({ params: { numbers: [1, 2, 3]} }), "<ul><li>1</li><li>2</li><li>3</li></ul>");
      });

      it("links", () => {
        var tag = new Tag('<ul><li each="link in links"><a href="{link.href}">{link.title}</a></li></ul>', {}).build();
        assert.equal(tag.toHtml({ params: {
          links:[{ href: '#', title: 'home'}, { href: '/about', title: 'about' }] }
        }), '<ul><li><a href="#">home</a></li><li><a href="/about">about</a></li></ul>');
      });
    });
  });
});
