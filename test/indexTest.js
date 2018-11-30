import PoopyDiScoop from '../index';
import { expect } from 'chai';

describe("PoopyDiScoop", () => {
  it("loads components", async () => {
    let poopyDiScoop = new PoopyDiScoop('./example');
    await poopyDiScoop.load();

    expect(Object.keys(poopyDiScoop.project.components)).to.have.lengthOf(3);
    expect(poopyDiScoop.project.components).to.have.property('home');
    expect(poopyDiScoop.project.components).to.have.property('shared-nav');
    expect(poopyDiScoop.project.components).to.have.property('shared-footer');
  });
});