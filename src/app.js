import { appConfig } from "./config.js";
import { applySavingAction, createInitialState, updatePetSkin } from "./model.js";
import { manualInputAdapter } from "./input.js";
import { localStorageAdapter } from "./storage.js";

const storage = localStorageAdapter;
const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: appConfig.currency,
});

const refs = {
  app: document.getElementById("app"),
  petStage: document.getElementById("petStage"),
  petImage: document.getElementById("petImage"),
  petPlaceholder: document.getElementById("petPlaceholder"),
  petSkinSelect: document.getElementById("petSkinSelect"),
  actionsContainer: document.getElementById("actionsContainer"),
  balanceText: document.getElementById("balanceText"),
  hungerText: document.getElementById("hungerText"),
  hydrationText: document.getElementById("hydrationText"),
  moodText: document.getElementById("moodText"),
  manualForm: document.getElementById("manualForm"),
  manualActionType: document.getElementById("manualActionType"),
  manualAmount: document.getElementById("manualAmount"),
  manualNote: document.getElementById("manualNote"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  jsonArea: document.getElementById("jsonArea"),
  historyList: document.getElementById("historyList"),
};

let state = createInitialState();

function imageWithFallback(img, src, placeholderText) {
  img.onerror = () => {
    img.style.display = "none";
    if (img.nextElementSibling?.classList.contains("placeholder")) {
      img.nextElementSibling.textContent = placeholderText;
      img.nextElementSibling.style.display = "grid";
    }
  };
  img.onload = () => {
    img.style.display = "block";
    if (img.nextElementSibling?.classList.contains("placeholder")) {
      img.nextElementSibling.style.display = "none";
    }
  };
  img.src = src;
}

function renderSkinOptions() {
  const skins = Object.entries(appConfig.petSkins);
  refs.petSkinSelect.innerHTML = "";
  skins.forEach(([key, skin]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = skin.label;
    if (key === state.petSkin) option.selected = true;
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
    amount.textContent = `默认 +${currencyFormatter.format(action.defaultAmount)}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `记录${action.label}`;
    button.addEventListener("click", () => {
      saveRecord(action.key, action.defaultAmount, "快捷按钮");
    });

    card.append(img, title, amount, button);
    refs.actionsContainer.appendChild(card);

    const option = document.createElement("option");
    option.value = action.key;
    option.textContent = action.label;
    refs.manualActionType.appendChild(option);
  });
}

function renderHistory() {
  refs.historyList.innerHTML = "";
  if (!state.history.length) {
    const li = document.createElement("li");
    li.textContent = "还没有记录，先开始一次存钱吧。";
    refs.historyList.appendChild(li);
    return;
  }

  state.history.forEach((item) => {
    const action = appConfig.actions.find((entry) => entry.key === item.actionKey);
    const li = document.createElement("li");
    li.textContent = `${action?.label || item.actionKey}：${currencyFormatter.format(item.amount)} · ${new Date(item.createdAt).toLocaleString("zh-CN")}${item.note ? ` · ${item.note}` : ""}`;
    refs.historyList.appendChild(li);
  });
}

function renderState() {
  refs.balanceText.textContent = currencyFormatter.format(state.balance);
  refs.hungerText.textContent = String(state.pet.hunger);
  refs.hydrationText.textContent = String(state.pet.hydration);
  refs.moodText.textContent = String(state.pet.mood);

  const skin = appConfig.petSkins[state.petSkin] || appConfig.petSkins.default;
  imageWithFallback(refs.petImage, skin.image, "角色皮套图片未设置");

  renderSkinOptions();
  renderHistory();
}

async function persist() {
  await storage.save(state);
}

async function saveRecord(actionKey, amount, note) {
  try {
    state = applySavingAction(state, actionKey, amount, note);
    renderState();
    await persist();
  } catch (error) {
    alert(error.message);
  }
}

function bindEvents() {
  refs.petSkinSelect.addEventListener("change", async (event) => {
    state = updatePetSkin(state, event.target.value);
    renderState();
    await persist();
  });

  refs.manualForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const parsed = manualInputAdapter.parse({
      actionKey: refs.manualActionType.value,
      amount: refs.manualAmount.value,
      note: refs.manualNote.value,
    });
    await saveRecord(parsed.actionKey, parsed.amount, parsed.note || "手动记录");
    refs.manualAmount.value = "";
    refs.manualNote.value = "";
  });

  refs.exportBtn.addEventListener("click", async () => {
    refs.jsonArea.value = await storage.exportState();
  });

  refs.importBtn.addEventListener("click", async () => {
    try {
      const imported = await storage.importState(refs.jsonArea.value);
      state = imported;
      renderState();
    } catch {
      alert("导入失败：请检查 JSON 格式");
    }
  });
}

async function initialize() {
  if (appConfig.backgroundImage) {
    refs.app.style.backgroundImage = `url(${appConfig.backgroundImage})`;
    refs.app.style.backgroundSize = "cover";
  }

  renderActions();

  const loaded = await storage.load();
  if (loaded) {
    state = loaded;
  } else {
    state = createInitialState(Object.keys(appConfig.petSkins)[0]);
  }

  renderState();
  bindEvents();
}

initialize();
