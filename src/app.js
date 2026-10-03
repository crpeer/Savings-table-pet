import { appConfig } from "./config.js";
import {
  applySavingAction,
  applyTimeDecay,
  createAccountingSummary,
  createInitialState,
  filterRecords,
  getExpProgress,
  inferPetState,
  normalizeState,
  updateMonthlyBudget,
  updatePetSkin,
  updateSettings,
  updateWindowPrefs,
} from "./model.js";
import { manualInputAdapter } from "./input.js";
import { localStorageAdapter } from "./storage.js";

const storage = localStorageAdapter;
const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: appConfig.currency,
});

const refs = {
  app: document.getElementById("app"),
  petWindow: document.getElementById("petWindow"),
  petWindowHeader: document.getElementById("petWindowHeader"),
  petWindowBody: document.getElementById("petWindowBody"),
  petStage: document.getElementById("petStage"),
  petStateText: document.getElementById("petStateText"),
  petImage: document.getElementById("petImage"),
  petPlaceholder: document.getElementById("petPlaceholder"),
  petSkinSelect: document.getElementById("petSkinSelect"),
  petSizeSelect: document.getElementById("petSizeSelect"),
  soundToggle: document.getElementById("soundToggle"),
  pinBtn: document.getElementById("pinBtn"),
  collapseBtn: document.getElementById("collapseBtn"),
  actionsContainer: document.getElementById("actionsContainer"),
  balanceText: document.getElementById("balanceText"),
  hungerText: document.getElementById("hungerText"),
  hydrationText: document.getElementById("hydrationText"),
  moodText: document.getElementById("moodText"),
  levelText: document.getElementById("levelText"),
  expText: document.getElementById("expText"),
  expProgress: document.getElementById("expProgress"),
  affinityText: document.getElementById("affinityText"),
  coinsText: document.getElementById("coinsText"),
  milestonesList: document.getElementById("milestonesList"),
  manualForm: document.getElementById("manualForm"),
  manualActionType: document.getElementById("manualActionType"),
  manualAmount: document.getElementById("manualAmount"),
  manualCategory: document.getElementById("manualCategory"),
  manualTags: document.getElementById("manualTags"),
  manualNote: document.getElementById("manualNote"),
  budgetForm: document.getElementById("budgetForm"),
  budgetInput: document.getElementById("budgetInput"),
  budgetText: document.getElementById("budgetText"),
  searchInput: document.getElementById("searchInput"),
  dailySummary: document.getElementById("dailySummary"),
  weeklySummary: document.getElementById("weeklySummary"),
  monthlySummary: document.getElementById("monthlySummary"),
  categoryChart: document.getElementById("categoryChart"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  jsonArea: document.getElementById("jsonArea"),
  historyList: document.getElementById("historyList"),
};

let state = createInitialState(Object.keys(appConfig.petSkins)[0], appConfig.defaultMonthlyBudget);
let recentActionKey = "";
let recentActionTimeout = null;
let audioContext = null;
let animationInterval = null;

function imageWithFallback(img, src, placeholderText) {
  img.onerror = () => {
    img.style.display = "none";
    refs.petPlaceholder.textContent = placeholderText;
    refs.petPlaceholder.style.display = "grid";
  };
  img.onload = () => {
    img.style.display = "block";
    refs.petPlaceholder.style.display = "none";
  };
  img.src = src;
}

function labelForPetState(petState) {
  if (petState === "walk") return "巡逻";
  if (petState === "interact") return "互动";
  if (petState === "mood") return "高兴";
  return "待机";
}

function setPetStateVisual(petState) {
  refs.petStage.dataset.petState = petState;
  refs.petStateText.textContent = `状态：${labelForPetState(petState)}`;
}

function playInteractionSound() {
  if (!state.settings.soundEnabled) return;
  try {
    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContext = new Ctx();
    }
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 620;
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch {
    // 浏览器阻止音频时忽略
  }
}

function renderSkinOptions() {
  refs.petSkinSelect.innerHTML = "";
  Object.entries(appConfig.petSkins).forEach(([key, skin]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = skin.label;
    option.selected = key === state.petSkin;
    refs.petSkinSelect.appendChild(option);
  });
}

function renderActions() {
  refs.actionsContainer.innerHTML = "";
  refs.manualActionType.innerHTML = "";

  appConfig.actions.forEach((action) => {
    const card = document.createElement("article");
    card.className = "action-card";

    const img = document.createElement("img");
    img.alt = `${action.label}图片`;
    img.src = action.image;

    const title = document.createElement("strong");
    title.textContent = action.label;

    const amount = document.createElement("span");
    amount.className = "hint";
    amount.textContent = `默认 +${currencyFormatter.format(action.defaultAmount)} · ${action.defaultCategory}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `记录${action.label}`;
    button.addEventListener("click", () => {
      saveRecord({
        actionKey: action.key,
        amount: action.defaultAmount,
        note: "快捷按钮",
        category: action.defaultCategory,
        tags: action.defaultTags || [],
      });
    });

    card.append(img, title, amount, button);
    refs.actionsContainer.appendChild(card);

    const option = document.createElement("option");
    option.value = action.key;
    option.textContent = action.label;
    refs.manualActionType.appendChild(option);
  });
}

function renderMilestones() {
  refs.milestonesList.innerHTML = "";
  if (!state.pet.milestones.length) {
    const li = document.createElement("li");
    li.textContent = "暂无里程碑，先完成第一笔记录。";
    refs.milestonesList.appendChild(li);
    return;
  }

  state.pet.milestones.forEach((key) => {
    const li = document.createElement("li");
    li.textContent = `✅ ${appConfig.milestoneMeta[key] || key}`;
    refs.milestonesList.appendChild(li);
  });
}

function renderHistory() {
  refs.historyList.innerHTML = "";
  const filtered = filterRecords(state.history, refs.searchInput.value || "");
  if (!filtered.length) {
    const li = document.createElement("li");
    li.textContent = "没有匹配记录，试试更短的关键词。";
    refs.historyList.appendChild(li);
    return;
  }

  filtered.slice(0, 60).forEach((item) => {
    const action = appConfig.actions.find((entry) => entry.key === item.actionKey);
    const tagsText = item.tags?.length ? ` · #${item.tags.join(" #")}` : "";
    const li = document.createElement("li");
    li.textContent = `${action?.label || item.actionKey}：${currencyFormatter.format(item.amount)} · ${item.category}${tagsText} · ${new Date(item.createdAt).toLocaleString("zh-CN")}${item.note ? ` · ${item.note}` : ""}`;
    refs.historyList.appendChild(li);
  });
}

function renderCategoryChart(categoryTotals) {
  refs.categoryChart.innerHTML = "";
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    refs.categoryChart.textContent = "本月暂无分类统计。";
    return;
  }

  const maxValue = entries[0][1] || 1;
  entries.slice(0, 6).forEach(([category, total]) => {
    const row = document.createElement("div");
    row.className = "chart-row";

    const name = document.createElement("span");
    name.textContent = category;

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    const inner = document.createElement("span");
    inner.style.width = `${Math.max(6, (total / maxValue) * 100)}%`;
    bar.appendChild(inner);

    const value = document.createElement("span");
    value.textContent = currencyFormatter.format(total);

    row.append(name, bar, value);
    refs.categoryChart.appendChild(row);
  });
}

function renderAccounting() {
  const summary = createAccountingSummary(state, new Date());
  refs.dailySummary.textContent = `${currencyFormatter.format(summary.daily.total)} / ${summary.daily.count} 条`;
  refs.weeklySummary.textContent = `${currencyFormatter.format(summary.weekly.total)} / ${summary.weekly.count} 条`;
  refs.monthlySummary.textContent = `${currencyFormatter.format(summary.monthly.total)} / ${summary.monthly.count} 条`;
  refs.budgetText.textContent = `本月预算：${currencyFormatter.format(summary.budget)} · 剩余：${currencyFormatter.format(summary.budgetRemaining)}`;
  refs.budgetInput.value = String(summary.budget);
  renderCategoryChart(summary.categoryTotals);
}

function renderWindow() {
  refs.petWindow.classList.toggle("pinned", Boolean(state.window.pinned));
  refs.petWindow.classList.toggle("collapsed", Boolean(state.window.collapsed));
  refs.petWindow.classList.remove("size-sm", "size-md", "size-lg");
  refs.petWindow.classList.add(`size-${state.window.size}`);

  refs.pinBtn.textContent = state.window.pinned ? "取消置顶" : "置顶";
  refs.collapseBtn.textContent = state.window.collapsed ? "展开" : "收起";
  refs.petSizeSelect.value = state.window.size;
  refs.soundToggle.checked = Boolean(state.settings.soundEnabled);

  const hasPosition = Number.isFinite(state.window.x) && Number.isFinite(state.window.y);
  if (hasPosition) {
    refs.petWindow.style.left = `${state.window.x}px`;
    refs.petWindow.style.top = `${state.window.y}px`;
    refs.petWindow.style.right = "auto";
    refs.petWindow.style.bottom = "auto";
  }
}

function renderState() {
  refs.balanceText.textContent = currencyFormatter.format(state.balance);
  refs.hungerText.textContent = String(state.pet.hunger);
  refs.hydrationText.textContent = String(state.pet.hydration);
  refs.moodText.textContent = String(state.pet.mood);
  refs.levelText.textContent = String(state.pet.level);
  refs.affinityText.textContent = String(state.pet.affinity);
  refs.coinsText.textContent = String(state.pet.coins);

  const expProgress = getExpProgress(state.pet);
  refs.expText.textContent = `${expProgress.current}/${expProgress.needed}`;
  refs.expProgress.style.width = `${Math.round(expProgress.ratio * 100)}%`;

  const skin = appConfig.petSkins[state.petSkin] || appConfig.petSkins.default;
  imageWithFallback(refs.petImage, skin.image, "角色皮套图片未设置");

  renderSkinOptions();
  renderMilestones();
  renderAccounting();
  renderHistory();
  renderWindow();

  const petState = inferPetState(state.pet, recentActionKey);
  setPetStateVisual(petState);
}

async function persist() {
  await storage.save(state);
}

function markInteraction(actionKey) {
  recentActionKey = actionKey;
  clearTimeout(recentActionTimeout);
  recentActionTimeout = setTimeout(() => {
    recentActionKey = "";
    setPetStateVisual(inferPetState(state.pet));
  }, 1400);
}

async function saveRecord(payload) {
  try {
    state = applyTimeDecay(state);
    state = applySavingAction(state, payload);
    markInteraction(payload.actionKey);
    playInteractionSound();
    renderState();
    await persist();
  } catch (error) {
    alert(error.message);
  }
}

function startPetAnimationLoop() {
  clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    if (recentActionKey) return;
    const random = Math.random();
    if (random > 0.7) {
      setPetStateVisual("walk");
      setTimeout(() => {
        if (!recentActionKey) {
          setPetStateVisual(inferPetState(state.pet));
        }
      }, 850);
    } else {
      setPetStateVisual(inferPetState(state.pet));
    }
  }, 4200);
}

function bindDrag() {
  let dragData = null;

  const onPointerMove = (event) => {
    if (!dragData) return;
    const windowRect = refs.petWindow.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - windowRect.width);
    const maxY = Math.max(0, window.innerHeight - 60);
    const x = Math.min(maxX, Math.max(0, dragData.startX + event.clientX - dragData.pointerStartX));
    const y = Math.min(maxY, Math.max(0, dragData.startY + event.clientY - dragData.pointerStartY));

    refs.petWindow.style.left = `${x}px`;
    refs.petWindow.style.top = `${y}px`;
    refs.petWindow.style.right = "auto";
    refs.petWindow.style.bottom = "auto";
    dragData.currentX = x;
    dragData.currentY = y;
  };

  const onPointerUp = async () => {
    if (!dragData) return;
    const { currentX, currentY } = dragData;
    dragData = null;
    state = updateWindowPrefs(state, { x: currentX, y: currentY });
    await persist();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  refs.petWindowHeader.addEventListener("pointerdown", (event) => {
    if (event.target.tagName === "BUTTON") return;
    const rect = refs.petWindow.getBoundingClientRect();
    dragData = {
      startX: rect.left,
      startY: rect.top,
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      currentX: rect.left,
      currentY: rect.top,
    };
    refs.petWindowHeader.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });
}

function bindEvents() {
  refs.petSkinSelect.addEventListener("change", async (event) => {
    state = updatePetSkin(state, event.target.value);
    renderState();
    await persist();
  });

  refs.petSizeSelect.addEventListener("change", async (event) => {
    state = updateWindowPrefs(state, { size: event.target.value });
    renderState();
    await persist();
  });

  refs.soundToggle.addEventListener("change", async (event) => {
    state = updateSettings(state, { soundEnabled: event.target.checked });
    await persist();
  });

  refs.pinBtn.addEventListener("click", async () => {
    state = updateWindowPrefs(state, { pinned: !state.window.pinned });
    renderState();
    await persist();
  });

  refs.collapseBtn.addEventListener("click", async () => {
    state = updateWindowPrefs(state, { collapsed: !state.window.collapsed });
    renderState();
    await persist();
  });

  refs.manualForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const parsed = manualInputAdapter.parse({
      actionKey: refs.manualActionType.value,
      amount: refs.manualAmount.value,
      note: refs.manualNote.value,
      category: refs.manualCategory.value,
      tags: refs.manualTags.value,
    });

    const action = appConfig.actions.find((item) => item.key === parsed.actionKey);
    await saveRecord({
      actionKey: parsed.actionKey,
      amount: parsed.amount,
      note: parsed.note || "手动记录",
      category: parsed.category || action?.defaultCategory || "未分类",
      tags: parsed.tags.length ? parsed.tags : action?.defaultTags || [],
    });

    refs.manualAmount.value = "";
    refs.manualTags.value = "";
    refs.manualNote.value = "";
  });

  refs.budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      state = updateMonthlyBudget(state, refs.budgetInput.value);
      renderState();
      await persist();
    } catch (error) {
      alert(error.message);
    }
  });

  refs.searchInput.addEventListener("input", () => {
    renderHistory();
  });

  refs.exportBtn.addEventListener("click", async () => {
    refs.jsonArea.value = await storage.exportState();
  });

  refs.importBtn.addEventListener("click", async () => {
    try {
      const imported = await storage.importState(refs.jsonArea.value);
      state = normalizeState(imported, Object.keys(appConfig.petSkins)[0], appConfig.defaultMonthlyBudget);
      state = applyTimeDecay(state);
      renderState();
      await persist();
    } catch {
      alert("导入失败：请检查 JSON 格式");
    }
  });

  bindDrag();

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) return;
    if (!Number.isFinite(state.window.x) || !Number.isFinite(state.window.y)) return;
    state = updateWindowPrefs(state, { x: null, y: null });
    refs.petWindow.style.left = "";
    refs.petWindow.style.top = "";
    refs.petWindow.style.right = "10px";
    refs.petWindow.style.bottom = "10px";
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch {
    // 忽略注册失败
  }
}

function fillCategoryHint() {
  const defaultValue = appConfig.categories[0] || "";
  if (!refs.manualCategory.value) {
    refs.manualCategory.value = defaultValue;
  }
}

async function initialize() {
  if (appConfig.backgroundImage) {
    refs.app.style.backgroundImage = `url(${appConfig.backgroundImage})`;
    refs.app.style.backgroundSize = "cover";
  }

  renderActions();

  const loaded = await storage.load();
  state = normalizeState(loaded, Object.keys(appConfig.petSkins)[0], appConfig.defaultMonthlyBudget);
  state = applyTimeDecay(state);

  fillCategoryHint();
  renderState();
  bindEvents();
  startPetAnimationLoop();
  await persist();
  await registerServiceWorker();

  setInterval(async () => {
    const nextState = applyTimeDecay(state);
    if (nextState.lastDecayAt !== state.lastDecayAt) {
      state = nextState;
      renderState();
      await persist();
    }
  }, 60 * 1000);
}

initialize();
