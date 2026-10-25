/* CookieRun: Kingdom 6-Star Conversion Calculator
 * Conversion rules from the official update notices:
 * - Add leftover Soulstones/Soulcores to the amounts previously spent.
 * - Convert up to 450 combined units at 120%, rounding fractions up.
 * - Each combined unit above 450 becomes one Legendary Soulstone Choice Chest.
 *
 * Legacy costs below are based on the community wiki's progression tables.
 * The unlock cost (20 Soulstones) is included in the cumulative Soulstone total.
 * New-grade thresholds include the unlock cost, so ★1 starts at 40 total.
 */
const COOKIE_RULES = {
  conversionRate: 1.2,
  threshold: 450,
  // Current legacy stage 0..10: base, ★1..★5, then ★1A..★5A.
  legacySoulstonesSpent: [0, 40, 70, 120, 190, 290, 290, 290, 290, 290, 290],
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
  const total = input.ownedSoulstones + spentSoulstones + input.ownedSoulcores + spentSoulcores;
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
    stage, spentSoulstones, spentSoulcores, total, soulstoneConversionBasis,
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

  const lines = [
    `현재 단계: ${stageLabel(result.stage)}`,
    `현재 보유 영혼석: ${formatNumber(input.ownedSoulstones)}개`,
    `현재 단계까지 사용한 영혼석(누적): ${formatNumber(result.spentSoulstones)}개`,
    `현재 보유 초월영혼석: ${formatNumber(input.ownedSoulcores)}개`,
    `현재 단계까지 사용한 초월영혼석(누적): ${formatNumber(result.spentSoulcores)}개`,
    `합산량: ${formatNumber(result.total)}개`,
    `120% 환산 대상: ${formatNumber(result.soulstoneConversionBasis)}개 → ${formatNumber(result.convertedSoulstones)}개 (소수점 올림)`,
    `450개 초과분: ${formatNumber(result.excess)}개 → 레전더리 영혼석 선택 상자 ${formatNumber(result.chestCount)}개`,
    `환산 재료로 가능한 최대 성급: ${newGradeLabel(result.maxAffordableGrade)}`,
    `기존 달성 단계 기준 상한: ${newGradeLabel(result.previousGradeCap)}`,
    `최종 성급: ${newGradeLabel(result.finalGrade)}`,
    `최종 성급 기준 잔여 영혼석: ${formatNumber(result.remainingSoulstones)}개`
  ];
  const list = document.getElementById("breakdown");
  list.replaceChildren();
  for (const line of lines) {
    const item = document.createElement("li");
    item.textContent = line;
    list.appendChild(item);
  }
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
        ownedSoulstones: readNonNegativeInteger("ownedSoulstones"),
        ownedSoulcores: readNonNegativeInteger("ownedSoulcores")
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
