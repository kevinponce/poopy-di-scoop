import GetParams from '../src/getParams';
import assert from 'assert';

describe('GetParams', () => {
  it('single param', () => {
    assert.deepEqual(new GetParams('Hello {world}').build(), { 'world': 'string' });
  })

  it('two params', () => {
    assert.deepEqual(new GetParams('{hello} {world}').build(), { 'hello': 'string', 'world': 'string' });
  })
});
