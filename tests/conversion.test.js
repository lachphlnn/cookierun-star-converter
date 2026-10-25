const assert = require("node:assert/strict");
const { COOKIE_RULES, calculateConversion } = require("../app.js");

const zero = calculateConversion({ grade: 0, ownedSoulstones: 0, ownedSoulcores: 0 });
assert.equal(zero.total, 0);
assert.equal(zero.convertedSoulstones, 0);
assert.equal(zero.finalGrade, 0);

// Stage 5 is legacy ★5: 290 cumulative Soulstones, no Soulcores.
const fiveStar = calculateConversion({ grade: 5, ownedSoulstones: 10, ownedSoulcores: 0 });
assert.equal(fiveStar.spentSoulstones, 290);
assert.equal(fiveStar.spentSoulcores, 0);
assert.equal(fiveStar.total, 300);
assert.equal(fiveStar.convertedSoulstones, 360);
assert.equal(fiveStar.finalGrade, 4); // ★4 needs 250; ★5 needs 380.
assert.equal(fiveStar.remainingSoulstones, 110);

// Stage 7 is legacy ★2 ascension: 290 Soulstones + 50 Soulcores spent.
const twoAscension = calculateConversion({ grade: 7, ownedSoulstones: 0, ownedSoulcores: 0 });
assert.equal(twoAscension.spentSoulstones, 290);
assert.equal(twoAscension.spentSoulcores, 50);
assert.equal(twoAscension.total, 340);
assert.equal(twoAscension.convertedSoulstones, 408);
assert.equal(twoAscension.finalGrade, 5); // Capped at ★6, but 408 affords only ★5.
assert.equal(twoAscension.remainingSoulstones, 28);

const overThreshold = calculateConversion({ grade: 5, ownedSoulstones: 160, ownedSoulcores: 0 });
assert.equal(overThreshold.total, 450);
assert.equal(overThreshold.convertedSoulstones, 540);
assert.equal(overThreshold.chestCount, 0);
assert.equal(overThreshold.finalGrade, 5); // Existing ★5 caps the new grade at ★5.
assert.equal(overThreshold.remainingSoulstones, 160);

const aboveThreshold = calculateConversion({ grade: 5, ownedSoulstones: 185, ownedSoulcores: 0 });
assert.equal(aboveThreshold.total, 475);
assert.equal(aboveThreshold.convertedSoulstones, 540);
assert.equal(aboveThreshold.chestCount, 25);

// Every legacy stage has a defined cumulative spent amount.
for (let stage = 0; stage <= 10; stage++) {
  const result = calculateConversion({ grade: stage, ownedSoulstones: 0, ownedSoulcores: 0 });
  assert.equal(result.spentSoulstones, COOKIE_RULES.legacySoulstonesSpent[stage]);
  assert.equal(result.spentSoulcores, COOKIE_RULES.legacySoulcoresSpent[stage]);
}

console.log("All conversion tests passed.");
