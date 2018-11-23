import Project from '../src/project';
import Component from '../src/component';
import assert from 'assert';
import { expect } from 'chai';

describe("Project", () => {
  var nav = new Component({ name: 'nav', html: '<ul class="header"><li>1</li><li>2</li></ul>' }).build();
  var footer = new Component({ name: 'footer', html: '<ul class="footer"><li>1</li><li>2</li></ul>' }).build();
  var homepage = new Component({ name: 'homepage', html: '<div><nav/><p>test</p><footer/></div>' }).build();
  var circular1 = new Component({ name: 'circular', html: '<div><circular2 /></div>' }).build();
  var circular2 = new Component({ name: 'circular2', html: '<div><circular></circular></div>' }).build();

  it("load: nav", () => {
    var project = new Project();
    project.load(nav);
    project.load(circular2);

    project.build();

    assert.equal(!!project.get(nav.name), true);
    assert.equal(!!project.get(footer.name), false);
    assert.equal(!!project.get('invalidName'), false);
    assert.equal(!!project.get(circular2.name), true);
    assert.equal(!!project.get(circular1.name), false);
  });

  it("load: nav, footer", () => {
    var project = new Project();
    project.load(nav);
    project.load(footer);

    assert.equal(!!project.get(nav.name), true);
    assert.equal(!!project.get(footer.name), true);
    assert.equal(!!project.get('invalidName'), false);
  });

  describe("buildDependents", () => {
    it("simple", () => {
      var project = new Project();
      project.load(nav);
      project.load(circular1);
      project.load(circular2);

      project.buildDependents()

      assert.deepEqual(project.components[nav.name].dependents, []);
      assert.deepEqual(project.components[circular1.name].dependents, ["circular2"]);
      assert.deepEqual(project.components[circular2.name].dependents, ["circular"]);
    });

    it("nested", () => {
      var project = new Project();
      project.load(new Component({ name: 'a', html: '<b/>' }).build());
      project.load(new Component({ name: 'b', html: '<c/>' }).build());
      project.load(new Component({ name: 'c', html: '<a/>' }).build());
      project.buildDependents()

      assert.deepEqual(project.components['a'].dependents.includes('c'), true);
      assert.deepEqual(project.components['b'].dependents.includes('a'), true);
      assert.deepEqual(project.components['c'].dependents.includes('b'), true);
    });
  });

  it("isCircular", () => {
    var project = new Project();
    project.load(new Component({ name: 'comp1', html: '<comp2/>' }).build());
    project.load(new Component({ name: 'comp2', html: '<comp1/>' }).build());
    project.load(nav);
    project.buildDependents();

    assert.equal(true, true);

    assert.equal(project.isCircular('comp1'), true);
    assert.equal(project.isCircular('comp2'), true);
    assert.equal(project.isCircular(nav.name), false);
  });

  describe('#indexOf()', () => {
    var project = new Project();
    project.load(new Component({ name: 'comp1', html: '<comp2/>' }).build());
    project.load(new Component({ name: 'comp2', html: '<comp3/>' }).build());
    project.load(new Component({ name: 'comp3', html: '<comp4/>' }).build());
    project.load(new Component({ name: 'comp4', html: '<comp1/>' }).build());
    project.load(nav);
    project.buildDependents();

    it("isCircular", () => {
      assert.equal(project.isCircular('comp1'), true);
      assert.equal(project.isCircular('comp2'), true);
      assert.equal(project.isCircular('comp3'), true);
      assert.equal(project.isCircular('comp4'), true);
      assert.equal(project.isCircular(nav.name), false);
    });

    it('should not throw an error', () => {
      expect(() => project.build()).to.throw('comp1 is circular');
    });
  });
});
