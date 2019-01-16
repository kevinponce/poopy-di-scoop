import PoopyDiScoop from '../src/index';
import { expect } from 'chai';

describe("PoopyDiScoop", () => {
  it("loads components", async () => {
    let poopyDiScoop = new PoopyDiScoop({ rootDir: './example' });
    await poopyDiScoop.load();

    expect(Object.keys(poopyDiScoop.components)).to.have.lengthOf(5);
    expect(poopyDiScoop.components).to.have.property('home');
    expect(poopyDiScoop.components).to.have.property('shared-nav1');
    expect(poopyDiScoop.components).to.have.property('shared-nav2');
    expect(poopyDiScoop.components).to.have.property('shared-footer');
  });
});
