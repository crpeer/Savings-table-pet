const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const petEffectByAction = {
  food: { hunger: +18, hydration: -2, mood: +6 },
  water: { hunger: -1, hydration: +20, mood: +4 },
  shopping: { hunger: -2, hydration: -2, mood: +12 },
  pocketMoney: { hunger: -1, hydration: -1, mood: +10 },
};

const MAX_HISTORY = 240;
const EXP_PER_LEVEL = 100;

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekRange(date = new Date()) {
  const input = new Date(date);
  const day = input.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const start = new Date(input);
  start.setDate(input.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function normalizePet(rawPet = {}) {
  const level = Number.isFinite(rawPet.level) ? Math.max(1, Math.floor(rawPet.level)) : 1;
  const exp = Number.isFinite(rawPet.exp) ? Math.max(0, Math.floor(rawPet.exp)) : 0;
  return {
    hunger: clamp(Number(rawPet.hunger ?? 50)),
    hydration: clamp(Number(rawPet.hydration ?? 50)),
    mood: clamp(Number(rawPet.mood ?? 50)),
    level,
    exp,
    affinity: Number.isFinite(rawPet.affinity) ? Math.max(0, Math.floor(rawPet.affinity)) : 0,
    coins: Number.isFinite(rawPet.coins) ? Math.max(0, Math.floor(rawPet.coins)) : 0,
  };
}

function normalizeHistory(rawHistory = []) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .filter((item) => item && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0)
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      actionKey: item.actionKey || "manual",
      amount: Number(Number(item.amount).toFixed(2)),
      note: String(item.note || ""),
      category: String(item.category || "未分类"),
      tags: Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
        : [],
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .slice(0, MAX_HISTORY);
}

function normalizeWindow(rawWindow = {}) {
  return {
    x: Number.isFinite(rawWindow.x) ? rawWindow.x : null,
    y: Number.isFinite(rawWindow.y) ? rawWindow.y : null,
    pinned: Boolean(rawWindow.pinned),
    collapsed: Boolean(rawWindow.collapsed),
    size: ["sm", "md", "lg"].includes(rawWindow.size) ? rawWindow.size : "md",
  };
}

function getMonthlyRecordCount(history, monthKey) {
  return history.filter((entry) => toMonthKey(entry.createdAt) === monthKey).length;
}

function collectMilestones(state) {
  const milestoneSet = new Set(state.pet.milestones);
  if (state.history.length >= 1) milestoneSet.add("firstRecord");
  if (state.balance >= 500) milestoneSet.add("balance500");
  if (state.pet.level >= 3) milestoneSet.add("level3");
  if (state.pet.level >= 5) milestoneSet.add("level5");
  if (getMonthlyRecordCount(state.history, toMonthKey()) >= 10) milestoneSet.add("monthly10");
  return Array.from(milestoneSet);
}

function applyExpGrowth(pet, expGain) {
  let exp = pet.exp + expGain;
  let level = pet.level;
  while (exp >= EXP_PER_LEVEL) {
    exp -= EXP_PER_LEVEL;
    level += 1;
  }
  return { ...pet, exp, level };
}

export function createInitialState(defaultSkin = "default", defaultMonthlyBudget = 2000) {
  return {
    version: 2,
    petSkin: defaultSkin,
    balance: 0,
    totals: {},
    pet: {
      hunger: 50,
      hydration: 50,
      mood: 50,
      level: 1,
      exp: 0,
      affinity: 0,
      coins: 0,
      milestones: [],
    },
    accounting: {
      monthlyBudget: Number(defaultMonthlyBudget) || 0,
    },
    window: {
      x: null,
      y: null,
      pinned: false,
      collapsed: false,
      size: "md",
    },
    settings: {
      soundEnabled: false,
    },
    lastDecayAt: new Date().toISOString(),
    history: [],
  };
}

export function normalizeState(rawState, defaultSkin = "default", defaultMonthlyBudget = 2000) {
  const fallback = createInitialState(defaultSkin, defaultMonthlyBudget);
  if (!rawState || typeof rawState !== "object") return fallback;

  const history = normalizeHistory(rawState.history);
  const pet = normalizePet(rawState.pet);
  const normalized = {
    ...fallback,
    version: 2,
    petSkin: rawState.petSkin || defaultSkin,
    balance: Number.isFinite(rawState.balance) ? Number(rawState.balance) : 0,
    totals: rawState.totals && typeof rawState.totals === "object" ? rawState.totals : {},
    pet: {
      ...pet,
      milestones: Array.isArray(rawState?.pet?.milestones) ? rawState.pet.milestones : [],
    },
    accounting: {
      monthlyBudget: Number.isFinite(rawState?.accounting?.monthlyBudget)
        ? Number(rawState.accounting.monthlyBudget)
        : Number(defaultMonthlyBudget) || 0,
    },
    window: normalizeWindow(rawState.window),
    settings: {
      soundEnabled: Boolean(rawState?.settings?.soundEnabled),
    },
    lastDecayAt: rawState.lastDecayAt || new Date().toISOString(),
    history,
  };

  normalized.pet.milestones = collectMilestones(normalized);
  normalized.balance = Number(normalized.balance.toFixed(2));
  return normalized;
}

export function applyTimeDecay(state, nowMs = Date.now()) {
  const lastMs = new Date(state.lastDecayAt).getTime();
  if (!Number.isFinite(lastMs) || nowMs <= lastMs) return state;

  const hours = Math.floor((nowMs - lastMs) / (1000 * 60 * 60));
  if (hours < 1) return state;

  const hungerLoss = Math.floor(hours / 3);
  const hydrationLoss = Math.floor(hours / 2);
  const moodLoss = Math.floor(hours / 4);

  return {
    ...state,
    pet: {
      ...state.pet,
      hunger: clamp(state.pet.hunger - hungerLoss),
      hydration: clamp(state.pet.hydration - hydrationLoss),
      mood: clamp(state.pet.mood - moodLoss),
    },
    lastDecayAt: new Date(nowMs).toISOString(),
  };
}

export function applySavingAction(state, payload) {
  const value = Number(payload.amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("金额必须大于 0");
  }

  const actionKey = payload.actionKey || "manual";
  const effect = petEffectByAction[actionKey] ?? { hunger: 0, hydration: 0, mood: 0 };
  const safeAmount = Number(value.toFixed(2));

  const record = {
    id: crypto.randomUUID(),
    actionKey,
    amount: safeAmount,
    note: String(payload.note || ""),
    category: String(payload.category || "未分类"),
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 8) : [],
    createdAt: new Date().toISOString(),
  };

  const expGain = Math.max(4, Math.min(20, Math.round(safeAmount / 5)));
  const coinsGain = Math.max(1, Math.round(safeAmount / 4));
  const affinityGain = Math.max(1, Math.round((effect.mood + 10) / 4));

  const grownPet = applyExpGrowth(state.pet, expGain);
  const nextState = {
    ...state,
    balance: Number((state.balance + safeAmount).toFixed(2)),
    totals: {
      ...state.totals,
      [actionKey]: Number((((state.totals[actionKey] || 0) + safeAmount)).toFixed(2)),
    },
    pet: {
      ...grownPet,
      hunger: clamp(state.pet.hunger + effect.hunger),
      hydration: clamp(state.pet.hydration + effect.hydration),
      mood: clamp(state.pet.mood + effect.mood),
      affinity: grownPet.affinity + affinityGain,
      coins: grownPet.coins + coinsGain,
    },
    history: [record, ...state.history].slice(0, MAX_HISTORY),
    lastDecayAt: new Date().toISOString(),
  };

  return {
    ...nextState,
    pet: {
      ...nextState.pet,
      milestones: collectMilestones(nextState),
    },
  };
}

export function updatePetSkin(state, skinKey) {
  return { ...state, petSkin: skinKey };
}

export function updateMonthlyBudget(state, amount) {
  const budget = Number(amount);
  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error("预算必须是大于等于 0 的数字");
  }

  return {
    ...state,
    accounting: {
      ...state.accounting,
      monthlyBudget: Number(budget.toFixed(2)),
    },
  };
}

export function updateWindowPrefs(state, patch) {
  return {
    ...state,
    window: {
      ...state.window,
      ...patch,
      size: ["sm", "md", "lg"].includes(patch?.size) ? patch.size : state.window.size,
    },
  };
}

export function updateSettings(state, patch) {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...patch,
    },
  };
}

function summarizeRange(history, startTime, endTime) {
  const list = history.filter((entry) => {
    const time = new Date(entry.createdAt).getTime();
    return time >= startTime && time < endTime;
  });
  const total = list.reduce((acc, entry) => acc + entry.amount, 0);
  return {
    total: Number(total.toFixed(2)),
    count: list.length,
    list,
  };
}

export function createAccountingSummary(state, now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);

  const week = getWeekRange(now);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const daily = summarizeRange(state.history, dayStart.getTime(), dayEnd.getTime());
  const weekly = summarizeRange(state.history, week.start.getTime(), week.end.getTime());
  const monthly = summarizeRange(state.history, monthStart.getTime(), monthEnd.getTime());

  const categoryTotals = monthly.list.reduce((acc, entry) => {
    const category = entry.category || "未分类";
    acc[category] = Number(((acc[category] || 0) + entry.amount).toFixed(2));
    return acc;
  }, {});

  const budget = Number(state?.accounting?.monthlyBudget || 0);
  return {
    daily,
    weekly,
    monthly,
    budget,
    budgetRemaining: Number((budget - monthly.total).toFixed(2)),
    categoryTotals,
  };
}

export function filterRecords(history, query = "") {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return history;
  return history.filter((item) => {
    const tags = Array.isArray(item.tags) ? item.tags.join(" ") : "";
    return [item.note, item.category, tags, item.actionKey]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

export function getExpProgress(pet) {
  return {
    current: pet.exp,
    needed: EXP_PER_LEVEL,
    ratio: clamp(pet.exp / EXP_PER_LEVEL, 0, 1),
  };
}

export function inferPetState(pet, recentAction = "") {
  if (recentAction) return "interact";
  if (pet.mood >= 70) return "mood";
  if (pet.hunger <= 20 || pet.hydration <= 20) return "walk";
  return "idle";
}

export function getTodayKey() {
  return toDateKey(new Date());
}
