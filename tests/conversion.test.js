const assert = require("node:assert/strict");
const { COOKIE_RULES, calculateConversion } = require("../app.js");

const zero = calculateConversion({ grade: 0, ownedMaterial: 0 });
assert.equal(zero.total, 0);
assert.equal(zero.convertedSoulstones, 0);
assert.equal(zero.finalGrade, 0);

// Stage 5 is legacy ★5: the slider amount is leftover Soulcores (0–20).
const fiveStar = calculateConversion({ grade: 5, ownedMaterial: 10 });
assert.equal(fiveStar.spentSoulstones, 270);
assert.equal(fiveStar.spentSoulcores, 0);
assert.equal(fiveStar.ownedSoulstones, 0);
assert.equal(fiveStar.ownedSoulcores, 10);
assert.equal(fiveStar.total, 280);
assert.equal(fiveStar.convertedSoulstones, 336);
assert.equal(fiveStar.finalGrade, 4); // ★4 needs 250; ★5 needs 380.
assert.equal(fiveStar.remainingSoulstones, 86);

// Stage 7 is legacy ★2 ascension: 270 Soulstones + 50 Soulcores spent.
const twoAscension = calculateConversion({ grade: 7, ownedMaterial: 0 });
assert.equal(twoAscension.spentSoulstones, 270);
assert.equal(twoAscension.spentSoulcores, 50);
assert.equal(twoAscension.total, 320);
assert.equal(twoAscension.convertedSoulstones, 384);
assert.equal(twoAscension.finalGrade, 5); // Existing stage cap and converted amount allow ★5.
assert.equal(twoAscension.remainingSoulstones, 4);

const overThreshold = calculateConversion({ grade: 9, ownedMaterial: 45 });
assert.equal(overThreshold.total, 455);
assert.equal(overThreshold.convertedSoulstones, 540);
assert.equal(overThreshold.chestCount, 5);
assert.equal(overThreshold.finalGrade, 6);
assert.equal(overThreshold.remainingSoulstones, 0);

const aboveThreshold = calculateConversion({ grade: 9, ownedMaterial: 60 });
assert.equal(aboveThreshold.total, 470);
assert.equal(aboveThreshold.convertedSoulstones, 540);
assert.equal(aboveThreshold.chestCount, 20);


// User example: legacy ★3 spent 100 Soulstones; 60 left means 160 total.
const threeStar = calculateConversion({ grade: 3, ownedMaterial: 60 });
assert.equal(threeStar.spentSoulstones, 100);
assert.equal(threeStar.total, 160);

// Ascension stage treats the single leftover input as Soulcores.
const oneAscensionWithLeftover = calculateConversion({ grade: 6, ownedMaterial: 10 });
assert.equal(oneAscensionWithLeftover.ownedSoulstones, 0);
assert.equal(oneAscensionWithLeftover.ownedSoulcores, 10);
assert.equal(oneAscensionWithLeftover.total, 300); // 270 spent Soulstones + 20 spent cores + 10 remaining cores.

// Every legacy stage has a defined cumulative spent amount.
for (let stage = 0; stage <= 10; stage++) {
  const result = calculateConversion({ grade: stage, ownedMaterial: 0 });
  assert.equal(result.spentSoulstones, COOKIE_RULES.legacySoulstonesSpent[stage]);
  assert.equal(result.spentSoulcores, COOKIE_RULES.legacySoulcoresSpent[stage]);
}

console.log("All conversion tests passed.");
