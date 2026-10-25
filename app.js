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

// Maximum remaining materials available on the slider for each selected stage.
// Normal grades use the next Soulstone promotion cost; ascension grades use
// the next Soulcore promotion cost. The final stage uses the largest step cost.
const MATERIAL_MAX_BY_STAGE = {
  1: 30, 2: 50, 3: 70, 4: 100, 5: 100,
  6: 30, 7: 40, 8: 50, 9: 60, 10: 60
};

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
  document.getElementById("chests").textContent = `${formatNumber(result.chestCount)}개`;

  const starContainer = document.getElementById("final-grade-stars");
  starContainer.replaceChildren();
  starContainer.classList.toggle("is-six-star", result.finalGrade === 6);
  if (result.finalGrade === 6) {
    // At ★6, show the supplied full ascension sprite instead of individual stars.
    const sprite = document.createElement("img");
    sprite.src = "assets/six-star-sprite.png";
    sprite.alt = "6성 초월 스프라이트";
    sprite.className = "six-star-sprite";
    sprite.draggable = false;
    starContainer.appendChild(sprite);
  } else {
    // Keep the existing individual-star display for all results through ★5.
    for (let grade = 1; grade <= 6; grade += 1) {
      const star = document.createElement("img");
      star.src = `assets/${grade <= result.finalGrade ? "star-normal.png" : "star-empty.png"}`;
      star.alt = "";
      star.draggable = false;
      starContainer.appendChild(star);
    }
  }
  const finalGradeLabel = document.getElementById("final-grade-label");
  finalGradeLabel.textContent = newGradeLabel(result.finalGrade);
  starContainer.setAttribute("aria-label", `예상 최종 성급 ${newGradeLabel(result.finalGrade)}`);

  const thresholds = COOKIE_RULES.newGradeThresholds;
  const currentThreshold = thresholds[result.finalGrade];
  const nextGrade = Math.min(result.finalGrade + 1, thresholds.length - 1);
  const nextThreshold = thresholds[nextGrade];
  const isMaxGrade = result.finalGrade >= thresholds.length - 1;
  const progress = isMaxGrade
    ? 100
    : Math.max(0, Math.min(100, ((result.convertedSoulstones - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
  const needed = isMaxGrade ? 0 : Math.max(0, nextThreshold - result.convertedSoulstones);

  const progressBar = document.getElementById("grade-progress");
  progressBar.setAttribute("aria-valuenow", String(Math.round(progress)));
  document.getElementById("grade-progress-fill").style.width = `${progress}%`;
  document.getElementById("progress-percent").textContent = isMaxGrade ? "최고 성급" : `${Math.round(progress)}%`;
  document.getElementById("progress-needed").textContent = isMaxGrade
    ? "더 높은 성급이 없습니다."
    : needed === 0
      ? "다음 성급 기준을 충족했어요."
      : `다음 성급까지 ${formatNumber(needed)}개 필요`;
  document.getElementById("progress-title").textContent = isMaxGrade
    ? "성급 진행도"
    : `★${nextGrade}까지 진행도`;

  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (hasDOM) {
  const gradeInput = document.getElementById("grade");
  const materialInput = document.getElementById("ownedMaterial");
  const materialSlider = document.getElementById("ownedMaterialSlider");
  const materialUnit = document.getElementById("material-unit");
  const materialMaxLabel = document.getElementById("material-max-label");

  function updateMaterialLimit(stage) {
    const max = MATERIAL_MAX_BY_STAGE[stage] ?? 0;
    materialInput.max = String(max);
    materialSlider.max = String(max);
    materialMaxLabel.textContent = `최대 ${formatNumber(max)}개`;
    materialUnit.textContent = stage >= 6 ? "초월영혼석" : "영혼석";
    const current = Math.max(0, Math.min(max, Number(materialInput.value) || 0));
    materialInput.value = String(current);
    materialSlider.value = String(current);
  }

  function selectGrade(value) {
    gradeInput.value = String(value);
    updateMaterialLimit(value);
    gradeButtons.forEach((button) => {
      const buttonGrade = Number(button.dataset.grade);
      const selected = buttonGrade <= value;
      button.classList.toggle("selected", selected);
      button.classList.toggle("current", buttonGrade === value);
      button.setAttribute("aria-pressed", String(buttonGrade === value));
      const starImage = button.querySelector("img");
      if (starImage) {
        const imageName = selected
          ? (buttonGrade <= 5 ? "star-normal.png" : "star-ascension.png")
          : "star-empty.png";
        starImage.src = `assets/${imageName}`;
        starImage.alt = "";
      }
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

  materialInput.addEventListener("input", () => {
    const max = Number(materialInput.max) || 0;
    const raw = materialInput.value.trim();
    if (raw === "") {
      materialSlider.value = "0";
      return;
    }
    const value = Math.max(0, Math.min(max, Math.trunc(Number(raw) || 0)));
    materialSlider.value = String(value);
  });
  materialInput.addEventListener("change", () => {
    const max = Number(materialInput.max) || 0;
    const value = Math.max(0, Math.min(max, Math.trunc(Number(materialInput.value) || 0)));
    materialInput.value = String(value);
    materialSlider.value = String(value);
  });
  materialSlider.addEventListener("input", () => {
    materialInput.value = materialSlider.value;
  });

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
    window.setTimeout(() => {
      materialInput.value = "0";
      materialSlider.value = "0";
      selectGrade(5);
      results.hidden = true;
    }, 0);
  });
}

function readNonNegativeInteger(id) {
  const raw = document.getElementById(id).value.trim();
  // An empty field means zero remaining materials.
  if (raw === "") return 0;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("보유 재료는 0 이상의 정수로 입력해 주세요.");
  }
  return value;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { COOKIE_RULES, MATERIAL_MAX_BY_STAGE, calculateConversion, stageLabel };
}
