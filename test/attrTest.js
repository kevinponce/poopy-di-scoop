import Attr from '../src/attr';
import assert from 'assert';

describe("Attr", () => {
  it("tag: a, attr: href", () => {
    var attr = new Attr('<a href="#">test</a>', { start: 3 }).build();
    assert.equal(attr.key, "href");
    assert.equal(attr.value, "#");
    assert.equal(attr.endAt, 11);
  });

  it("tag: a, attr: class", () => {
    var attr = new Attr('<a href="#" class="hello you">test</a>', { start: 12 }).build();
    assert.equal(attr.key, "class");
    assert.equal(attr.value, "hello you");
    assert.equal(attr.endAt, 29);
  });

  it("tag: input, attr: value", () => {
    var attr = new Attr('<input value="submit" required/>', { start: 7 }).build();
    assert.equal(attr.key, "value");
    assert.equal(attr.value, "submit");
    assert.equal(attr.endAt, 21);
  });

  it("tag: input, attr: required", () => {
    var attr = new Attr('<input value="submit" required/>', { start: 22 }).build();
    assert.equal(attr.key, "required");
    assert.equal(attr.value, null);
    assert.equal(attr.endAt, 30);
  });

  it("single quote", () => {
    var attr = new Attr("<input value='submit' required/>", { start: 22 }).build();
    assert.equal(attr.key, "required");
    assert.equal(attr.value, null);
    assert.equal(attr.endAt, 30);
  });
});
