import PoopyDiScoop from '../src/index2';
import { expect } from 'chai';

describe("PoopyDiScoop", () => {
  it("loads components", async () => {
    let poopyDiScoop = new PoopyDiScoop({ rootDir: './example' });
    await poopyDiScoop.load();

    expect(Object.keys(poopyDiScoop.components)).to.have.lengthOf(4);
    expect(poopyDiScoop.components).to.have.property('home');
    expect(poopyDiScoop.components).to.have.property('shared-nav');
    expect(poopyDiScoop.components).to.have.property('shared-footer');
  });
});
