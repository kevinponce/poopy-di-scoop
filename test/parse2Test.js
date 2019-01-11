import Parse from '../src/parse2';
import Project from '../src/project';
import Component from '../src/component';
import assert from 'assert';
import { PRETTY, COMPRESSED } from '../src/const';

const TEST = 'test';

describe('Parse', () => {
  describe('build', () => {
    it("test", () => {
      var parse = new Parse('<ul><li each="num in [1, 2, 3]">{num}</li></ul>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml(), '<ul class="pds-home"><li>1</li><li>2</li><li>3</li></ul>');
    });

    it("test2", () => {
      var parse = new Parse('<ul class="list"><li each ="num in [1, 2, 3]">{num}</li></ul>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml(), '<ul class="list pds-home"><li>1</li><li>2</li><li>3</li></ul>');
    });

    it("pass in simple array", () => {
      var parse = new Parse('<ul class="list"><li each ="num in numbers">{num}</li></ul>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ numbers: [1, 2, 3] }), '<ul class="list pds-home"><li>1</li><li>2</li><li>3</li></ul>');
    });

    it("pass in array of objects", () => {
      var parse = new Parse('<ul><li each ="link in links"><a href="{link.href}">{link.title}</a></li></ul>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();
      let params = {
        links: [{
          href: '/',
          title: 'home'
        }, {
          href: '/about',
          title: 'about'
        }, {
          href: '/contact',
          title: 'contact'
        }]
      }

      assert.equal(parse.toHtml(params), '<ul class="pds-home"><li><a href="/">home</a></li><li><a href="/about">about</a></li><li><a href="/contact">contact</a></li></ul>');
    });

    it("attr params", () => {
      var parse = new Parse('<div test="{hello}">you</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ hello: 'world'}), '<div test="world"class="pds-home">you</div>');
    });

    it("html with comment", () => {
      var parse = new Parse('<div>{hello}</div><!-- sdlfjlsdkf --><div>{world}</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ hello: 'you', world: 'other you'}), '<div class="pds-home">you</div><div class="pds-home">other you</div>');
    });

    it("html with embedded css", () => {
      var parse = new Parse('<div>{hello}</div><style type="text/css">html { color: #444; }</style><div>{world}</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ hello: 'you', world: 'other you'}), '<div class="pds-home">you</div><style type="text/css">html { color: #444; }</style><div class="pds-home">other you</div>');
    });

    it("basic comp", () => {
      let link = { html: '<a href="{link.href}">{link.title}</a>' };
      let links = { html: '<ul><li each ="link in links"><link /></li></ul>' };
      let comps = { link, links };
      let params = {
        links: [{
          href: '/',
          title: 'home'
        }, {
          href: '/about',
          title: 'about'
        }, {
          href: '/contact',
          title: 'contact'
        }]
      };

      var parse = new Parse(links.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml(params, comps), '<ul class="pds-home"><li><a href="/"class="pds-home-link">home</a></li><li><a href="/about"class="pds-home-link">about</a></li><li><a href="/contact"class="pds-home-link">contact</a></li></ul>');
    });

    it("embedded comp", () => {
      let parent = { html: '<div id="test">{children}</div>' };
      let link = { html: '<a href="{link.href}">{link.title}</a>' };
      let links = { html: '<ul><li each ="link in links"><link /></li></ul>' };
      let example = { html: '<parent><links /><h3>{hello}</h3><h2>{world}</h2></parent>' };
      let comps = { parent, links, link, example };
      let params = {
        links: [{
          href: '/',
          title: 'home'
        }, {
          href: '/about',
          title: 'about'
        }, {
          href: '/contact',
          title: 'contact'
        }],
        hello: 'you',
        world: 'other you'
      };

      var parse = new Parse(example.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml(params, comps), '<div id="test"class="pds-home-parent"><ul class="pds-home-links"><li><a href="/"class="pds-home-link">home</a></li><li><a href="/about"class="pds-home-link">about</a></li><li><a href="/contact"class="pds-home-link">contact</a></li></ul><h3 class="pds-home">you</h3><h2 class="pds-home">other you</h2></div>');
    });

    it("link css", () => {
      let home = { html: '<link href="home.css" type="text/css" compressed/>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({}, comps), '<style type="text/css">.test{color:#fff}#hello .me,.today{font-size:12px}.home,.jail{float:left}div.home .hmmm{clear:both}</style>');
    });

    it("link css namespaced", () => {
      let home = { html: '<div class="test"><link href="home.css" type="text/css" compressed namespaced/></div>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({}, comps), '<div class="test pds-home"><style type="text/css">.pds-home.test, .pds-home .test{color:#fff}.pds-home #hello .me,.pds-home .today{font-size:12px}.pds-home .home,.pds-home .jail{float:left}div.pds-home.home, ,.hmmm, .pds-home div.home .hmmm{clear:both}</style></div>');
    });

    it("link js", () => {
      let home = { html: '<script type="text/javascript" src="home.js" compressed></script>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({}, comps), '<script type="text/javascript">console.log("hello js");var test=!0;test&&alert("hi");</script>');
    });
  });
});
