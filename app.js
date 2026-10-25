/* CookieRun: Kingdom 6-Star Conversion Calculator
 * Conversion rules from the official update notices:
 * - Add leftover Soulstones/Soulcores to the amounts previously spent.
 * - Convert up to 450 combined units at 120%, rounding fractions up.
 * - Each combined unit above 450 becomes one Legendary Soulstone Choice Chest.
 *
 * Legacy costs below are based on the community wiki's progression tables.
 * Legacy Soulstone spent amounts exclude the initial unlock cost, matching
 * the progression example used for this calculator.
 * New-grade thresholds include the unlock cost, so ★1 starts at 40 total.
 */
const COOKIE_RULES = {
  conversionRate: 1.2,
  threshold: 450,
  // Current legacy stage 0..10: base, ★1..★5, then ★1A..★5A.
  legacySoulstonesSpent: [0, 20, 50, 100, 170, 270, 270, 270, 270, 270, 270],
  legacySoulcoresSpent:  [0,  0,  0,   0,   0,   0,  20,  50,  90, 140, 200],
  // Minimum cumulative converted Soulstones for new system: base, ★1..★6.
  newGradeThresholds: [0, 40, 80, 150, 250, 380, 540]
};

const hasDOM = typeof document !== "undefined";
const form = hasDOM ? document.getElementById("calculator-form") : null;
const results = hasDOM ? document.getElementById("results") : null;
const gradeButtons = hasDOM ? [...document.querySelectorAll("[data-grade]")] : [];

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function calculateConversion(input, rules = COOKIE_RULES) {
  const stage = Math.max(0, Math.min(10, Number(input.grade) || 0));
  const spentSoulstones = rules.legacySoulstonesSpent[stage];
  const spentSoulcores = rules.legacySoulcoresSpent[stage];
  // The single leftover-material field follows the selected stage: for an
  // ascension stage it represents leftover Soulcores; otherwise Soulstones.
  const ownedSoulstones = stage >= 6 ? 0 : input.ownedMaterial;
  const ownedSoulcores = stage >= 6 ? input.ownedMaterial : 0;
  const total = ownedSoulstones + spentSoulstones + ownedSoulcores + spentSoulcores;
  const soulstoneConversionBasis = Math.min(total, rules.threshold);
  const convertedSoulstones = Math.ceil(soulstoneConversionBasis * rules.conversionRate);
  const excess = Math.max(0, total - rules.threshold);
  const maxAffordableGrade = rules.newGradeThresholds.reduce(
    (grade, threshold, index) => convertedSoulstones >= threshold ? index : grade, 0
  );
  // Legacy ★1..★5 map to the corresponding new grade; any ascension stage
  // caps the new grade at ★6. The final grade is the lower of that cap and
  // the grade affordable with converted Soulstones.
  const previousGradeCap = stage === 0 ? 0 : Math.min(stage, 6);
  const finalGrade = Math.min(previousGradeCap, maxAffordableGrade);
  const finalGradeThreshold = rules.newGradeThresholds[finalGrade];
  const remainingSoulstones = convertedSoulstones - finalGradeThreshold;

  return {
    stage, ownedSoulstones, ownedSoulcores, spentSoulstones, spentSoulcores, total, soulstoneConversionBasis,
    convertedSoulstones, excess, chestCount: excess,
    maxAffordableGrade, previousGradeCap, finalGrade, remainingSoulstones
  };
}

function stageLabel(stage) {
  if (stage === 0) return "기본 획득";
  if (stage <= 5) return `★${stage}`;
  return `★${stage - 5} 초월`;
}

function newGradeLabel(grade) {
  return grade === 0 ? "기본 획득 상태" : `★${grade}`;
}

function showResult(input, result) {
  document.getElementById("total").textContent = formatNumber(result.total);
  document.getElementById("converted").textContent = formatNumber(result.convertedSoulstones);
  document.getElementById("chests").textContent = formatNumber(result.chestCount);
  document.getElementById("final-grade").textContent = newGradeLabel(result.finalGrade);
  document.getElementById("remaining").textContent = formatNumber(result.remainingSoulstones);

  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (hasDOM) {
  const gradeInput = document.getElementById("grade");
  function selectGrade(value) {
    gradeInput.value = String(value);
    gradeButtons.forEach((button) => {
      const buttonGrade = Number(button.dataset.grade);
      const selected = buttonGrade <= value;
      button.classList.toggle("selected", selected);
      button.classList.toggle("current", buttonGrade === value);
      button.setAttribute("aria-pressed", String(buttonGrade === value));
    });
    document.getElementById("grade-label").textContent = stageLabel(value);
  }
  // Delegate clicks from the star picker so taps/clicks continue to work even
  // if the button markup is later rearranged.
  const starPicker = document.querySelector(".star-picker");
  if (starPicker) {
    starPicker.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-grade]");
      if (!button || !starPicker.contains(button)) return;
      event.preventDefault();
      selectGrade(Number(button.dataset.grade));
    });
  }
  selectGrade(Number(gradeInput.value));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const input = {
        grade: Number(gradeInput.value),
        ownedMaterial: readNonNegativeInteger("ownedMaterial")
      };
      showResult(input, calculateConversion(input));
    } catch (error) {
      window.alert(error.message || "입력값을 확인해 주세요.");
    }
  });
  form.addEventListener("reset", () => {
    window.setTimeout(() => { selectGrade(5); results.hidden = true; }, 0);
  });
}

function readNonNegativeInteger(id) {
  const raw = document.getElementById(id).value.trim();
  const value = Number(raw);
  if (raw === "" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("보유 재료는 0 이상의 정수로 입력해 주세요.");
  }
  return value;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { COOKIE_RULES, calculateConversion, stageLabel };
}
