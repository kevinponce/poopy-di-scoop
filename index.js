function PoopyDiScoop(string) {
  if (typeof string !== "string") throw new TypeError("poopyDiScoop wants a string!");
  return string + '!';
}

module.exports = PoopyDiScoop;
