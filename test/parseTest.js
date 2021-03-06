import Parse from '../src/parse';
import Component from '../src/component';
import Page from '../src/page';
import assert from 'assert';
import { PRETTY, COMPRESSED } from '../src/const';
import { expect } from 'chai';

const TEST = 'test';

describe('Parse', () => {
  describe('html', () => {
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

      assert.equal(parse.toHtml({ params: { numbers: [1, 2, 3] } }), '<ul class="list pds-home"><li>1</li><li>2</li><li>3</li></ul>');
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

      assert.equal(parse.toHtml({ params }), '<ul class="pds-home"><li><a href="/">home</a></li><li><a href="/about">about</a></li><li><a href="/contact">contact</a></li></ul>');
    });

    it("attr params", () => {
      var parse = new Parse('<div test="{hello}">you</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ params: { hello: 'world' } }), '<div test="world"class="pds-home">you</div>');
    });

    it("html with comment", () => {
      var parse = new Parse('<div>{hello}</div><!-- sdlfjlsdkf --><div>{world}</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ params: { hello: 'you', world: 'other you' } }), '<div class="pds-home">you</div><div class="pds-home">other you</div>');
    });

    it("html with embedded css", () => {
      var parse = new Parse('<div>{hello}</div><style type="text/css">html { color: #444; }</style><div>{world}</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ params: { hello: 'you', world: 'other you' } }), '<div class="pds-home">you</div><style type="text/css">html { color: #444; }</style><div class="pds-home">other you</div>');
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

      assert.equal(parse.toHtml({ params, comps }), '<ul class="pds-home"><li><a href="/"class="pds-home pds-home-link">home</a></li><li><a href="/about"class="pds-home pds-home-link">about</a></li><li><a href="/contact"class="pds-home pds-home-link">contact</a></li></ul>');
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

      assert.equal(parse.toHtml({ params, comps} ), '<div id="test"class="pds-home pds-home-parent"><ul class="pds-home pds-home-links"><li><a href="/"class="pds-home pds-home-link">home</a></li><li><a href="/about"class="pds-home pds-home-link">about</a></li><li><a href="/contact"class="pds-home pds-home-link">contact</a></li></ul><h3>you</h3><h2>other you</h2></div>');
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

      assert.equal(parse.toHtml({ comps }), '<style type="text/css">.test{color:#fff}#hello .me,.today{font-size:12px}.home,.jail{float:left}div.home .hmmm{clear:both} </style>');
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

      assert.equal(parse.toHtml({ comps }), '<div class="test pds-home"><style type="text/css">.pds-home.test, .pds-home .test{color:#fff}.pds-home #hello .me,.pds-home .today{font-size:12px}.pds-home .home,.pds-home .jail{float:left}div.pds-home.home, ,.hmmm, .pds-home div.home .hmmm{clear:both} </style></div>');
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

      assert.equal(parse.toHtml({ comps }), '<script type="text/javascript">console.log("hello js");var test=!0;test&&alert("hi");</script>');
    });

    it("params with component", () => {
      let home = { html: '<div raw="html">|{test}|</div>' };
      let code = { html: '<div>code will bere here</div>' };
      let comps = { home, code };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ params: { test: 'test me <code /> hi you' }, comps }), '<div class="pds-home">|test me <div class="pds-home-param pds-home-param-code">code will bere here</div> hi you|</div>');
    });


    it("default param", () => {
      let home = { html: '<div>{test || \'me\'}</div>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ comps }), '<div class="pds-home">me</div>');
    });

    it("code with a tag", () => {
      let home = { html: '<code raw="text">#include <Servo.h></code>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ comps }), '<code class="pds-home">#include <Servo.h></code>');
    });
  });

  describe('paramsUsed', () => {
    it("simple", () => {
      let home = { html: '<div>{test}</div>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      expect(parse.paramsUsed(comps)).to.eql({"test": {"type": "string" } });
    });

    it("object", () => {
      let home = { html: '<a href="{link.url}">{link.title}</a>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      expect(parse.paramsUsed(comps)).to.eql({ "link": { "url": { "type": "string" }, "title": { "type": "string" } } });
    });

    it("object with default", () => {
      let home = { html: '<a href="{link.url || "/"}">{link.title || "home" }</a>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      expect(parse.paramsUsed(comps)).to.eql({ "link": { "url": { "type": "string", "default": " /" }, "title": { "type": "string", "default": "home" } } });
    });

    it("each as param", () => {
      let home = { html: '<ul><li each="num in test" class="kevin">{num}</li></ul>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      expect(parse.paramsUsed(comps)).to.eql({ "test": [{ "type": "string" }] });
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

      expect(parse.paramsUsed(comps)).to.eql({ "links": [{ "href": { "type": "string" }, "title": { "type": "string" } }], "hello": { "type": "string" }, "world": { "type": "string" } });
    });

    it("each as param", () => {
      let home = { html: '<ul><li each=\'link in [{ "href": "#", "title": "Home"}, { "href": "/about", "title": "About"}]\'><a href="{link.href}">{link.title}</a></li></ul>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      expect(parse.paramsUsed(comps)).to.eql({ });
    });

    it("each as param", () => {
      let home = { html: '<div>{link}</di><ul><li each=\'link in [{ "href": "#", "title": "Home"}, { "href": "/about", "title": "About"}]\'><a href="{link.href}">{link.title}</a></li></ul>' };
      let comps = { home };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      expect(parse.paramsUsed(comps)).to.eql({ "link": { "type": "string" } });
    });

    it("each as param", () => {
      let nav2 = { html: "<nav class='my-nav'><ul><li each='link in nav2.links'><a href='{link.href}'>{link.title}</a></li></ul></nav>" };
      let home = { html: "<div class='home'><nav2 /></div>" };
      let comps = { home, nav2 };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      let params = {
        nav2: {
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
      };

      assert.equal(parse.toHtml({ params, comps }), '<div class="home pds-home"><nav class="my-nav pds-home pds-home-nav2"><ul><li><a href="/">home</a></li><li><a href="/about">about</a></li><li><a href="/contact">contact</a></li></ul></nav></div>');
    });

    it("each as param", () => {
      let nav2 = { html: "<nav class='my-nav'><ul><li each='link in nav2.links'><a href='{link.href}'>{link.title}</a></li></ul></nav>" };
      let home = { html: "<div class='home'><nav2 /></div>" };
      let comps = { home, nav2 };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      let params = {
        nav2: {
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
      };

      assert.equal(parse.toHtml({ params, comps }), '<div class="home pds-home"><nav class="my-nav pds-home pds-home-nav2"><ul><li><a href="/">home</a></li><li><a href="/about">about</a></li><li><a href="/contact">contact</a></li></ul></nav></div>');
    });


    it("each as param", () => {
      let nav2 = { html: "<nav class='my-nav'><ul><li each='link in nav2.links'><a href='{link.href}'>{link.title}</a></li></ul></nav>" };
      let home = { html: "<div class='home'><nav2 /></div>" };
      let comps = { home, nav2 };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      let params = {
        nav2: {
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
      };

      assert.equal(parse.toHtml({ params, comps }), '<div class="home pds-home"><nav class="my-nav pds-home pds-home-nav2"><ul><li><a href="/">home</a></li><li><a href="/about">about</a></li><li><a href="/contact">contact</a></li></ul></nav></div>');
    });

    it("raw nested params", () => {
      var parse = new Parse('<div raw="text">{hi}</div>', {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();
      let params = { hi: 'hello' };

      assert.equal(parse.toHtml({ params }), '<div class="pds-home">{hi}</div>');
    });

    it("raw nested params", () => {
      let code = { html: "<div>{children}</div>" };
      let home = { html: '<div><code raw="text">{hi}</code></div>' };
      let params = { hi: 'hello' };
      let comps = { home, code };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ params, comps }), '<div class="pds-home"><div class="pds-home pds-home-code">{hi}</div></div>');
    });

    it("raw nested params", () => {
      let mycode = { html: "<div class=\"code-wrapper\">{children}</div>" };
      let home = { html: "<div raw=\"html\">{body}</div>" };
      let params = { body: '<mycode raw="text">{\r\n  \"presets\": [\"es2015\", \"stage-0\"]\r\n}</mycode>' };
      let comps = { home, mycode };

      var parse = new Parse(home.html, {
        path: './example/components/home.html',
        rootDir: './example/components',
        namespace: 'pds-home',
        name: 'home',
        fmt: COMPRESSED
      }).build();

      assert.equal(parse.toHtml({ params, comps }), '<div class="pds-home"><div class="code-wrapper pds-home-param pds-home-param-mycode">{ "presets": ["es2015", "stage-0"] }</div></div>');
    });
  });
});
