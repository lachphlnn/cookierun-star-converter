/*
 * CookieRun: Kingdom 6-Star Conversion Calculator
 * Official rules currently encoded:
 * - Sum currently owned Soulstones + currently owned Soulcores
 *   + Soulstones previously spent on promotion/ascension
 *   + Soulcores previously spent on promotion/ascension.
 * - Convert total at 120%; round fractional values up.
 * - If the pre-conversion combined amount exceeds 450, each unit above
 *   450 is converted to one Legendary Soulstone Choice Chest.
 *
 * IMPORTANT:
 * Official notice does not publish the full per-grade Soulstone threshold
 * table in the cited conversion section. Do not guess grade/leftover results.
 */
const COOKIE_RULES = {
  wind_archer: {
    name: "바람궁수 쿠키",
    officialNotice: "https://hub.cookierun-kingdom.com/ko/news/updates/july-2-update-notice",
    choiceChestKinds: 9,
    conversionRate: 1.2,
    rounding: "ceil",
    threshold: 450,
    gradeThresholdsVerified: false
  },
  moonlight: {
    name: "달빛술사 쿠키",
    officialNotice: "https://hub.cookierun-kingdom.com/news/updates/october-21-update-notice",
    choiceChestKinds: 10,
    conversionRate: 1.2,
    rounding: "ceil",
    threshold: 450,
    gradeThresholdsVerified: false
  }
};

const hasDOM = typeof document !== "undefined";
const form = hasDOM ? document.getElementById("calculator-form") : null;
const results = hasDOM ? document.getElementById("results") : null;
const cookieSelect = hasDOM ? document.getElementById("cookie") : null;
const cookieNote = hasDOM ? document.getElementById("cookie-note") : null;

function readNonNegativeInteger(id) {
  const raw = document.getElementById(id).value.trim();
  const value = Number(raw);
  if (raw === "" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("모든 재료 수량은 0 이상의 정수로 입력해 주세요.");
  }
  return value;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function calculateConversion(input, rule) {
  const total =
    input.ownedSoulstones +
    input.spentSoulstones +
    input.ownedSoulcores +
    input.spentSoulcores;

  // The official notice describes units above 450 as choice chests.
  // Therefore, only the first 450 units enter the 120% Soulstone conversion.
  const soulstoneConversionBasis = Math.min(total, rule.threshold);
  const convertedSoulstones = Math.ceil(soulstoneConversionBasis * rule.conversionRate);
  const excess = Math.max(0, total - rule.threshold);

  return {
    total,
    soulstoneConversionBasis,
    convertedSoulstones,
    excess,
    chestCount: excess,
    choiceChestKinds: rule.choiceChestKinds
  };
}

function showResult(input, result, rule) {
  document.getElementById("total").textContent = formatNumber(result.total);
  document.getElementById("converted").textContent = formatNumber(result.convertedSoulstones);
  document.getElementById("chests").textContent = formatNumber(result.chestCount);

  const lines = [
    `현재 보유 영혼석: ${formatNumber(input.ownedSoulstones)}개`,
    `과거 승급에 사용한 영혼석: ${formatNumber(input.spentSoulstones)}개`,
    `현재 보유 초월영혼석: ${formatNumber(input.ownedSoulcores)}개`,
    `과거 초월에 사용한 초월영혼석: ${formatNumber(input.spentSoulcores)}개`,
    `합산량: ${formatNumber(result.total)}개`,
    `영혼석 환산 대상: min(${formatNumber(result.total)}, 450) = ${formatNumber(result.soulstoneConversionBasis)}개`,
    `120% 환산: ${formatNumber(result.soulstoneConversionBasis)} × 1.2 = ${formatNumber(result.soulstoneConversionBasis * 1.2)} → 올림 ${formatNumber(result.convertedSoulstones)}개`,
    `450개 초과분: max(0, ${formatNumber(result.total)} − 450) = ${formatNumber(result.excess)}개`,
    `선택 상자 종류: ${rule.choiceChestKinds}종 레전더리 영혼석 선택 상자`
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
cookieSelect.addEventListener("change", () => {
  const rule = COOKIE_RULES[cookieSelect.value];
  cookieNote.textContent = rule.name + " · 공식 환산 규칙 확인";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const rule = COOKIE_RULES[cookieSelect.value];
    const input = {
      grade: Number(document.getElementById("grade").value),
      ownedSoulstones: readNonNegativeInteger("ownedSoulstones"),
      spentSoulstones: readNonNegativeInteger("spentSoulstones"),
      ownedSoulcores: readNonNegativeInteger("ownedSoulcores"),
      spentSoulcores: readNonNegativeInteger("spentSoulcores")
    };
    const result = calculateConversion(input, rule);
    showResult(input, result, rule);
  } catch (error) {
    window.alert(error.message || "입력값을 확인해 주세요.");
  }
});

form.addEventListener("reset", () => {
  results.hidden = true;
});
}

/* Export calculation helpers for Node-based tests, if required. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { COOKIE_RULES, calculateConversion };
}
