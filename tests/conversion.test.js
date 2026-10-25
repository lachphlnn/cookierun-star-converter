const assert = require("node:assert/strict");
const { COOKIE_RULES, calculateConversion } = require("../app.js");

const wind = COOKIE_RULES.wind_archer;

assert.deepEqual(
  calculateConversion({
    ownedSoulstones: 0,
    spentSoulstones: 0,
    ownedSoulcores: 0,
    spentSoulcores: 0
  }, wind),
  {
    total: 0,
    soulstoneConversionBasis: 0,
    convertedSoulstones: 0,
    excess: 0,
    chestCount: 0,
    choiceChestKinds: 9
  }
);

const sample = calculateConversion({
  ownedSoulstones: 100,
  spentSoulstones: 200,
  ownedSoulcores: 10,
  spentSoulcores: 50
}, wind);
assert.equal(sample.total, 360);
assert.equal(sample.soulstoneConversionBasis, 360);
assert.equal(sample.convertedSoulstones, 432);
assert.equal(sample.chestCount, 0);

const overThreshold = calculateConversion({
  ownedSoulstones: 200,
  spentSoulstones: 200,
  ownedSoulcores: 50,
  spentSoulcores: 25
}, wind);
assert.equal(overThreshold.total, 475);
assert.equal(overThreshold.soulstoneConversionBasis, 450);
assert.equal(overThreshold.convertedSoulstones, 540);
assert.equal(overThreshold.chestCount, 25);

console.log("All conversion tests passed.");
