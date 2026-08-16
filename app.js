"use strict";

const STORAGE_KEYS = {
  products: "kaibutsuScaleProductsV2",
  ranks: "kaibutsuScaleRanksV2",
  records: "kaibutsuScaleRecordsV2"
};

const DEFAULT_PRODUCTS = [
  { id: "goods", name: "雑貨", price: 30, category: "雑貨類", note: "未選別雑貨" },
  { id: "fishing", name: "釣具", price: 100, category: "その他", note: "竿・リール・小物" },
  { id: "plush", name: "ぬいぐるみ", price: 80, category: "雑貨類", note: "" },
  { id: "audio", name: "オーディオ", price: 100, category: "その他", note: "" },
  { id: "small-appliance", name: "小型家電", price: 50, category: "その他", note: "" },
  { id: "kitchen", name: "キッチン雑貨", price: 60, category: "雑貨類", note: "" },
  { id: "bag", name: "バッグ", price: 30, category: "雑貨類", note: "" },
  { id: "farm-tools", name: "農具", price: 40, category: "その他", note: "" }
];
let selectedProductCategory = "雑貨類";
const PRODUCT_CATEGORIES = [
  "家具類",
  "食器類",
  "雑貨類",
  "その他",
  "楽器類"
];

const DEFAULT_RANKS = [
  { id: "s", name: "S", rate: 100, note: "未使用・新品同様" },
  { id: "a", name: "A", rate: 100, note: "良品" },
  { id: "b", name: "B", rate: 80, note: "傷や汚れあり" },
  { id: "c", name: "C", rate: 50, note: "強い傷・欠品あり" },
  { id: "d", name: "D", rate: 20, note: "部品取り・難あり" },
  { id: "ng", name: "対象外", rate: 0, note: "買取不可" }
];

let products = loadArray(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
let ranks = loadArray(STORAGE_KEYS.ranks, DEFAULT_RANKS);
let records = loadArray(STORAGE_KEYS.records, []);

let selectedProductId = products[0]?.id ?? null;
let selectedRankId = ranks[0]?.id ?? null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindTabs();
  bindActions();
  renderAll();

  document.addEventListener("kaibutsu-auth-changed", (event) => {
    if (unsubscribeCloudSync) {
      unsubscribeCloudSync();
      unsubscribeCloudSync = null;
    }

    if (event.detail.user && window.kaibutsuFirebase?.db) {
      startCloudSync();
    }
  });

  if (window.kaibutsuUser && window.kaibutsuFirebase?.db) {
    startCloudSync();
  }
}

function waitForFirebase() {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (
        window.kaibutsuFirebase &&
        window.kaibutsuFirebase.db &&
        window.kaibutsuUser
      ) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
}

function loadArray(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : structuredCloneSafe(fallback);
  } catch {
    return structuredCloneSafe(fallback);
  }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveAll() {
  saveLocalOnly();
  saveCloud();
}
const CLOUD_COLLECTION = "kaibutsuScale";
const CLOUD_DOCUMENT = "shared";

let unsubscribeCloudSync = null;
function startCloudSync() {
    if (unsubscribeCloudSync) {
    unsubscribeCloudSync();
    unsubscribeCloudSync = null;
  }
  const {
    db,
    doc,
    getDoc,
    setDoc,
    onSnapshot
  } = window.kaibutsuFirebase;

  const sharedRef = doc(
    db,
    CLOUD_COLLECTION,
    CLOUD_DOCUMENT
  );

  getDoc(sharedRef)
    .then(async (snapshot) => {
      if (!snapshot.exists()) {
        console.log("初回クラウド登録を開始します");

        await setDoc(sharedRef, {
          products,
          ranks,
          records,
          updatedAt: new Date().toISOString(),
          updatedBy: window.kaibutsuUser?.email || ""
        });

        console.log("初回クラウド登録完了");
      }
    })
    .catch((error) => {
      console.error("Firestore初期確認エラー:", error);
    });

  unsubscribeCloudSync = onSnapshot(
    sharedRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.data();

      if (Array.isArray(data.products)) {
        products = data.products;
      }

      if (Array.isArray(data.ranks)) {
        ranks = data.ranks;
      }

      if (Array.isArray(data.records)) {
        records = data.records;
      }

      selectedProductId =
        products.find((item) => item.id === selectedProductId)?.id ??
        products[0]?.id ??
        null;

      selectedRankId =
        ranks.find((item) => item.id === selectedRankId)?.id ??
        ranks[0]?.id ??
        null;

      saveLocalOnly();
      renderAll();

      console.log("Firestoreから共有データを受信しました");
    },
    (error) => {
      console.error("Firestore同期エラー:", error);
    }
  );
}

function saveLocalOnly() {
  localStorage.setItem(
    STORAGE_KEYS.products,
    JSON.stringify(products)
  );

  localStorage.setItem(
    STORAGE_KEYS.ranks,
    JSON.stringify(ranks)
  );

  localStorage.setItem(
    STORAGE_KEYS.records,
    JSON.stringify(records)
  );
}

async function saveCloud() {
  if (
    !window.kaibutsuFirebase ||
    !window.kaibutsuUser
  ) {
    return;
  }

  const {
    db,
    doc,
    setDoc
  } = window.kaibutsuFirebase;

  const sharedRef = doc(
    db,
    CLOUD_COLLECTION,
    CLOUD_DOCUMENT
  );

  try {
    await setDoc(sharedRef, {
      products,
      ranks,
      records,
      updatedAt: new Date().toISOString(),
      updatedBy: window.kaibutsuUser?.email || ""
    });

    console.log("Firestoreへ保存しました");
  } catch (error) {
    console.error("Firestore保存エラー:", error);
  }
}
function bindTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });
}

function showTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindActions() {
  $("settings-open-button").addEventListener("click", () => showTab("settings"));
    $("mode-scale-button").addEventListener("click", () => {
    setTransactionMode("scale");
  });

  $("mode-estimate-button").addEventListener("click", () => {
    setTransactionMode("estimate");
  });
  $("quick-add-product-button").addEventListener("click", () => openEditDialog("product"));
  $("add-product-button").addEventListener("click", () => openEditDialog("product"));
  $("add-rank-button").addEventListener("click", () => openEditDialog("rank"));

  $("weight").addEventListener("input", updateCalculation);
  $("weight").addEventListener("keydown", (event) => {
    if (event.key === "Enter") registerRecord();
  });

  $("register-button").addEventListener("click", registerRecord);
  $("clear-button").addEventListener("click", clearRecords);
  $("export-csv-button").addEventListener("click", exportCsv);
  $("backup-button").addEventListener("click", backupData);
  $("restore-input").addEventListener("change", restoreData);
  $("reset-settings-button").addEventListener("click", resetSettings);

  $("edit-form").addEventListener("submit", saveEdit);
}
let transactionMode = "scale";

function setTransactionMode(mode) {
  transactionMode = mode;

  const scaleButton = $("mode-scale-button");
  const estimateButton = $("mode-estimate-button");
  const description = $("mode-description");
  const customerCard = $("customer-card");
  const estimateActions = $("estimate-actions");

  scaleButton.classList.toggle("active", mode === "scale");
  estimateButton.classList.toggle("active", mode === "estimate");

  if (mode === "estimate") {
  description.textContent =
    "商品を計量しながら買取見積を作成します。顧客登録は買取成立後に行います。";

 customerCard.hidden = true;
    estimateActions.hidden = false;
} else {
  description.textContent =
    "通常の計量・買取登録を行います。";

  customerCard.hidden = false;
    estimateActions.hidden = true;
}
function renderAll() {
  normalizeSelections();
  renderProductButtons();
  renderRankButtons();
  renderProductSettings();
  renderRankSettings();
  renderRecords();
  updateCalculation();
}

function normalizeSelections() {
  if (!products.some((item) => item.id === selectedProductId)) {
    selectedProductId = products[0]?.id ?? null;
  }
  if (!ranks.some((item) => item.id === selectedRankId)) {
    selectedRankId = ranks[0]?.id ?? null;
  }
}

function renderProductButtons() {
  const container = $("category-buttons");
  container.innerHTML = "";

  // カテゴリタブ
  const tabs = document.createElement("div");
  tabs.className = "product-category-tabs";

  PRODUCT_CATEGORIES.forEach((category) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "product-category-tab";

    if (category === selectedProductCategory) {
      tab.classList.add("selected");
    }

    tab.textContent = category;

    tab.addEventListener("click", () => {
      selectedProductCategory = category;

      const categoryProducts = products.filter(
        (product) =>
          (product.category ?? "その他") === category
      );

      if (
        categoryProducts.length > 0 &&
        !categoryProducts.some(
          (product) => product.id === selectedProductId
        )
      ) {
        selectedProductId = categoryProducts[0].id;
      }

      renderProductButtons();
      updateCalculation();
    });

    tabs.appendChild(tab);
  });

  container.appendChild(tabs);

  // 選択中カテゴリの商品だけ表示
  const productGrid = document.createElement("div");
  productGrid.className = "product-category-grid";

  const visibleProducts = products.filter(
    (product) =>
      (product.category ?? "その他") ===
      selectedProductCategory
  );

  visibleProducts.forEach((product) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";

    button.classList.toggle(
      "selected",
      product.id === selectedProductId
    );

    button.innerHTML = `
      <strong>${escapeHtml(product.name)}</strong>
      <span>
        ${number(product.price)}円/kg
        ${product.note ? `・${escapeHtml(product.note)}` : ""}
      </span>
    `;

    button.addEventListener("click", () => {
      selectedProductId = product.id;
      renderProductButtons();
      updateCalculation();
    });

    productGrid.appendChild(button);
  });

  container.appendChild(productGrid);
}
function renderRankButtons() {
  const container = $("rank-buttons");
  container.innerHTML = "";

  ranks.forEach((rank) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rank-button";
    button.classList.toggle("selected", rank.id === selectedRankId);
    button.innerHTML = `<strong>${escapeHtml(rank.name)}・${number(rank.rate)}%</strong><span>${escapeHtml(rank.note || "")}</span>`;
    button.addEventListener("click", () => {
      selectedRankId = rank.id;
      renderRankButtons();
      updateCalculation();
    });
    container.appendChild(button);
  });
}

function updateCalculation() {
  const product = getSelectedProduct();
  const rank = getSelectedRank();
  const weight = parseFloat($("weight").value) || 0;

  const baseAmount = product ? weight * Number(product.price) : 0;
  const finalAmount = rank ? Math.round(baseAmount * Number(rank.rate) / 100) : 0;
  const discountAmount = Math.max(0, Math.round(baseAmount) - finalAmount);

  $("selected-name").textContent = product?.name ?? "未選択";
  $("selected-price").textContent = number(product?.price ?? 0);
  $("selected-rank").textContent = rank?.name ?? "未選択";
  $("selected-rate").textContent = number(rank?.rate ?? 0);
  $("base-amount").textContent = yen(baseAmount);
  $("discount-amount").textContent = yen(discountAmount);
  $("calculated-amount").textContent = yen(finalAmount);
}

function getSelectedProduct() {
  return products.find((item) => item.id === selectedProductId) ?? null;
}

function getSelectedRank() {
  return ranks.find((item) => item.id === selectedRankId) ?? null;
}

function registerRecord() {
  const product = getSelectedProduct();
  const rank = getSelectedRank();
  const weight = parseFloat($("weight").value);
  const customer = $("customer").value.trim();

  if (!product) return showToast("商品を選択してください");
  if (!rank) return showToast("ランクを選択してください");
  if (!Number.isFinite(weight) || weight <= 0) {
    $("weight").focus();
    return showToast("重量を入力してください");
  }

  const baseAmount = Math.round(weight * Number(product.price));
  const finalAmount = Math.round(baseAmount * Number(rank.rate) / 100);
  const discountAmount = baseAmount - finalAmount;

  records.unshift({
    id: createId(),
    customer,
    productId: product.id,
    productName: product.name,
    unitPrice: Number(product.price),
    rankId: rank.id,
    rankName: rank.name,
    rate: Number(rank.rate),
    weight,
    baseAmount,
    discountAmount,
    amount: finalAmount,
    createdAt: new Date().toISOString()
  });

  saveAll();
  renderRecords();
  $("weight").value = "";
  updateCalculation();
  $("weight").focus();
  showToast("登録しました");
}

function renderRecords() {
  const list = $("record-list");
  list.innerHTML = "";

  $("empty-message").style.display = records.length ? "none" : "block";

  let totalWeight = 0;
  let totalAmount = 0;

  records.forEach((record) => {
    totalWeight += Number(record.weight) || 0;
    totalAmount += Number(record.amount) || 0;

    const row = document.createElement("div");
    row.className = "record";
    row.innerHTML = `
      <div>
        <div class="record-name">${escapeHtml(record.productName)}・${escapeHtml(record.rankName)}ランク</div>
        <div class="record-details">${decimal(record.weight)}kg × ${number(record.unitPrice)}円 × ${number(record.rate)}%</div>
        <div class="record-details">基準 ${yen(record.baseAmount)}円／減額 ${yen(record.discountAmount)}円${record.customer ? `／${escapeHtml(record.customer)}` : ""}</div>
      </div>
      <div>
        <div class="record-amount">${yen(record.amount)}円</div>
        <button class="delete-button" type="button">削除</button>
      </div>
    `;

    row.querySelector(".delete-button").addEventListener("click", () => deleteRecord(record.id));
    list.appendChild(row);
  });

  $("total-weight").textContent = `${decimal(totalWeight)} kg`;
  $("total-amount").textContent = `${yen(totalAmount)}円`;
}

function deleteRecord(id) {
  if (!confirm("この明細を削除しますか？")) return;
  records = records.filter((record) => record.id !== id);
  saveAll();
  renderRecords();
  showToast("削除しました");
}

function clearRecords() {
  if (!records.length) return;
  if (!confirm("明細をすべて削除しますか？")) return;
  records = [];
  saveAll();
  renderRecords();
  showToast("明細を全削除しました");
}

function renderProductSettings() {
  const container = $("product-settings-list");
  container.innerHTML = "";

  PRODUCT_CATEGORIES.forEach((category) => {
    const categoryProducts = products.filter(
      (product) =>
        (product.category ?? "その他") === category
    );

    if (categoryProducts.length === 0) return;

    const heading = document.createElement("h3");
    heading.className = "product-category-title";
    heading.textContent = category;
    container.appendChild(heading);

    categoryProducts.forEach((product) => {
      const index = products.findIndex(
        (entry) => entry.id === product.id
      );

      container.appendChild(
        createSettingRow({
          title: product.name,
          subtitle:
            `${number(product.price)}円/kg` +
            `${product.note ? `・${product.note}` : ""}`,
          onEdit: () =>
            openEditDialog("product", product.id),
          onDelete: () =>
            deleteSetting("product", product.id),
          onUp:
            index > 0
              ? () => moveItem("product", index, -1)
              : null,
          onDown:
            index < products.length - 1
              ? () => moveItem("product", index, 1)
              : null,
        })
      );
    });
  });
}

function renderRankSettings() {
  const container = $("rank-settings-list");
  container.innerHTML = "";

  ranks.forEach((rank, index) => {
    container.appendChild(createSettingRow({
      title: `${rank.name}・${number(rank.rate)}%`,
      subtitle: rank.note || "説明なし",
      onEdit: () => openEditDialog("rank", rank.id),
      onDelete: () => deleteSetting("rank", rank.id),
      onUp: index > 0 ? () => moveItem("rank", index, -1) : null,
      onDown: index < ranks.length - 1 ? () => moveItem("rank", index, 1) : null
    }));
  });
}

function createSettingRow({ title, subtitle, onEdit, onDelete, onUp, onDown }) {
  const row = document.createElement("div");
  row.className = "setting-row";

  const info = document.createElement("div");
  info.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span>`;

  const actions = document.createElement("div");
  actions.className = "setting-actions";

  if (onUp) actions.appendChild(actionButton("↑", onUp, "上へ"));
  if (onDown) actions.appendChild(actionButton("↓", onDown, "下へ"));
  actions.appendChild(actionButton("編集", onEdit));
  actions.appendChild(actionButton("削除", onDelete, "", "delete-setting"));

  row.append(info, actions);
  return row;
}

function actionButton(text, handler, ariaLabel = "", extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
  if (extraClass) button.className = extraClass;
  button.addEventListener("click", handler);
  return button;
}

function openEditDialog(type, id = "") {
  const isProduct = type === "product";
  const item = id
    ? (isProduct ? products : ranks).find((entry) => entry.id === id)
    : null;

  $("dialog-title").textContent = item
    ? `${isProduct ? "商品" : "ランク"}を編集`
    : `${isProduct ? "商品" : "ランク"}を追加`;

  $("edit-type").value = type;
  $("edit-id").value = id;
  $("edit-name").value = item?.name ?? "";
  $("edit-price").value = isProduct ? (item?.price ?? "") : "";
  $("edit-rate").value = !isProduct ? (item?.rate ?? "") : "";
  $("edit-note").value = item?.note ?? "";

  $("edit-category").value = isProduct
  ? (item?.category ?? "雑貨類")
  : "";

  $("category-field").style.display = isProduct
  ? "block"
  : "none";

  $("price-field").style.display = isProduct ? "block" : "none";
  $("rate-field").style.display = isProduct ? "none" : "block";

  $("edit-dialog").showModal();
  setTimeout(() => $("edit-name").focus(), 50);
}

function saveEdit(event) {
  event.preventDefault();

  const type = $("edit-type").value;
  const id = $("edit-id").value;
  const name = $("edit-name").value.trim();
  const note = $("edit-note").value.trim();
  const category = $("edit-category").value;

  if (!name) return showToast("名称を入力してください");

  if (type === "product") {
    const price = Number($("edit-price").value);
    if (!Number.isFinite(price) || price < 0) return showToast("単価を正しく入力してください");

    if (id) {
      const item = products.find((entry) => entry.id === id);
     Object.assign(item, {
  name,
  price,
  category,
  note
});
    } else {
     products.push({
  id: createId(),
  name,
  price,
  category,
  note
});
      selectedProductId = products.at(-1).id;
    }
  } else {
    const rate = Number($("edit-rate").value);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return showToast("支払率は0〜100で入力してください");
    }

    if (id) {
      const item = ranks.find((entry) => entry.id === id);
      Object.assign(item, { name, rate, note });
    } else {
      ranks.push({ id: createId(), name, rate, note });
      selectedRankId = ranks.at(-1).id;
    }
  }

  saveAll();
  $("edit-dialog").close();
  renderAll();
  showToast("保存しました");
}

function deleteSetting(type, id) {
  const list = type === "product" ? products : ranks;

  if (list.length <= 1) {
    return showToast("最低1件は必要です");
  }

  const item = list.find((entry) => entry.id === id);
  if (!confirm(`「${item?.name ?? ""}」を削除しますか？`)) return;

  if (type === "product") products = products.filter((entry) => entry.id !== id);
  else ranks = ranks.filter((entry) => entry.id !== id);

  saveAll();
  renderAll();
  showToast("削除しました");
}

function moveItem(type, index, direction) {
  const list = type === "product" ? products : ranks;
  const target = index + direction;
  if (target < 0 || target >= list.length) return;

  [list[index], list[target]] = [list[target], list[index]];
  saveAll();
  renderAll();
}

function resetSettings() {
  if (!confirm("商品とランクを初期設定に戻しますか？ 明細は残ります。")) return;
  products = structuredCloneSafe(DEFAULT_PRODUCTS);
  ranks = structuredCloneSafe(DEFAULT_RANKS);
  selectedProductId = products[0].id;
  selectedRankId = ranks[0].id;
  saveAll();
  renderAll();
  showToast("初期設定に戻しました");
}

function exportCsv() {
  if (!records.length) return showToast("保存する明細がありません");

  const headers = [
    "登録日時", "取引先", "商品", "ランク", "重量kg",
    "単価円/kg", "支払率%", "基準金額円", "減額円", "買取金額円"
  ];

  const rows = records.map((record) => [
    new Date(record.createdAt).toLocaleString("ja-JP"),
    record.customer,
    record.productName,
    record.rankName,
    record.weight,
    record.unitPrice,
    record.rate,
    record.baseAmount,
    record.discountAmount,
    record.amount
  ]);

  const csv = "\uFEFF" + [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  downloadBlob(csv, `開物_計量明細_${dateStamp()}.csv`, "text/csv;charset=utf-8");
  showToast("CSVを保存しました");
}

function backupData() {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    products,
    ranks,
    records
  };

  downloadBlob(
    JSON.stringify(data, null, 2),
    `開物_計量バックアップ_${dateStamp()}.json`,
    "application/json"
  );
  showToast("バックアップを保存しました");
}

async function restoreData(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.products) || !Array.isArray(data.ranks) || !Array.isArray(data.records)) {
      throw new Error("形式が違います");
    }

    if (!confirm("現在の設定と明細を、選択したバックアップで置き換えますか？")) return;

    products = data.products;
    ranks = data.ranks;
    records = data.records;
    saveAll();
    renderAll();
    showToast("復元しました");
  } catch (error) {
    alert(`復元できませんでした。\n${error.message}`);
  }
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function number(value) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function yen(value) {
  return Math.round(Number(value || 0)).toLocaleString("ja-JP");
}

function decimal(value) {
  return Number(value || 0).toFixed(2);
}

function dateStamp() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer;
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}
