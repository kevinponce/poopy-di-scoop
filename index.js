module.exports = function poopyDiScoop(string) {
  if (typeof string !== "string") throw new TypeError("poopyDiScoop wants a string!");
  return string.replace(/\s/g, "");
};
