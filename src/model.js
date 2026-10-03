const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const petEffectByAction = {
  food: { hunger: +18, hydration: -2, mood: +6 },
  water: { hunger: -1, hydration: +20, mood: +4 },
  shopping: { hunger: -2, hydration: -2, mood: +12 },
  pocketMoney: { hunger: -1, hydration: -1, mood: +10 },
};

export function createInitialState(defaultSkin = "default") {
  return {
    version: 1,
    petSkin: defaultSkin,
    balance: 0,
    totals: {
      food: 0,
      water: 0,
      shopping: 0,
      pocketMoney: 0,
    },
    pet: {
      hunger: 50,
      hydration: 50,
      mood: 50,
    },
    history: [],
  };
}

export function applySavingAction(state, actionKey, amount, note = "") {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("金额必须大于 0");
  }

  const effect = petEffectByAction[actionKey] ?? { hunger: 0, hydration: 0, mood: 0 };
  const record = {
    id: crypto.randomUUID(),
    actionKey,
    amount: Number(value.toFixed(2)),
    note,
    createdAt: new Date().toISOString(),
  };

  const nextHistory = [record, ...state.history].slice(0, 30);

  return {
    ...state,
    balance: Number((state.balance + value).toFixed(2)),
    totals: {
      ...state.totals,
      [actionKey]: Number(((state.totals[actionKey] || 0) + value).toFixed(2)),
    },
    pet: {
      hunger: clamp(state.pet.hunger + effect.hunger),
      hydration: clamp(state.pet.hydration + effect.hydration),
      mood: clamp(state.pet.mood + effect.mood),
    },
    history: nextHistory,
  };
}

export function updatePetSkin(state, skinKey) {
  return { ...state, petSkin: skinKey };
}
