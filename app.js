// ---------- storage helpers ----------
// Each seller's data lives under its own key prefix (DB is rebuilt in
// startApp() once we know who is logged in), so different accounts
// never see each other's orders/customers/blacklist entries.
let DB = { orders: "", customers: "", blacklist: "" };

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (e) { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

let orders = [];
let customers = [];
let blacklist = [];

// Called by auth.js right after a successful login/register, or on page
// load if a session already exists.
function startApp(sellerId) {
  DB = {
    orders: `tdn_${sellerId}_orders`,
    customers: `tdn_${sellerId}_customers`,
    blacklist: `tdn_${sellerId}_blacklist`,
  };
  orders = load(DB.orders);
  customers = load(DB.customers);
  blacklist = load(DB.blacklist);

  // seed a demo blacklist entry once per seller
  if (blacklist.length === 0) {
    blacklist = [{ phone: "0900000000", count: 3, note: "多次未取件" }];
    save(DB.blacklist, blacklist);
  }

  applyI18n();
  renderQuickCustomers();
  renderOrders();
  renderCustomers();
  renderBlacklistTable();
}

// ---------- toast ----------
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---------- tabs ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

// ---------- lang switch ----------
document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});

// ---------- validation ----------
function validateOrder(data) {
  const errors = {};
  if (!data.name || data.name.length < 2 || data.name.length > 10) errors.name = t("errNameLen");
  if (!/^09\d{8}$/.test(data.phone)) errors.phone = t("errPhone");
  if (!/^\d{6}$/.test(data.store)) errors.store = t("errStoreEmpty");
  else if (!findStoreByCode(data.store)) errors.store = t("errStoreInvalid");
  if (!data.product) errors.product = t("errProduct");
  if (isNaN(data.amount) || Number(data.amount) <= 0) errors.amount = t("errAmount");
  return errors;
}

function clearErrors() {
  ["name", "phone", "store", "product", "amount"].forEach(f => {
    document.getElementById("err_" + f).textContent = "";
  });
}

// ---------- 7-11 store picker ----------
const storeModal = document.getElementById("storeModal");
const storeCitySelect = document.getElementById("storeCitySelect");
const storeKeyword = document.getElementById("storeKeyword");
const storeResults = document.getElementById("storeResults");
const storeResultsEmpty = document.getElementById("storeResultsEmpty");
const storeConfirm = document.getElementById("storeConfirm");
const f_store = document.getElementById("f_store");

function populateCitySelect() {
  storeCitySelect.innerHTML = `<option value="">${t("storeAllCities")}</option>` +
    STORE_CITIES.map(c => `<option value="${c}">${c}</option>`).join("");
}

function renderStoreResults() {
  const city = storeCitySelect.value;
  const keyword = storeKeyword.value;
  const results = searchStores({ city, keyword });
  storeResults.innerHTML = "";
  storeResultsEmpty.style.display = results.length === 0 ? "block" : "none";
  storeResultsEmpty.textContent = results.length === 0 && (city || keyword) ? t("storeNoResults") : t("storeResultsEmpty");

  results.forEach(s => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "store-item";
    item.innerHTML = `
      <div class="store-item-name">${escapeHtml(s.name)} <span class="store-item-code">#${s.code}</span></div>
      <div class="store-item-addr">${escapeHtml(s.addr)}</div>
    `;
    item.addEventListener("click", () => selectStore(s));
    storeResults.appendChild(item);
  });
}

function selectStore(s) {
  f_store.value = s.code;
  f_store.dataset.name = s.name;
  f_store.dataset.addr = s.addr;
  storeConfirm.style.display = "block";
  storeConfirm.textContent = `✓ ${s.name} (#${s.code}) － ${s.addr}`;
  document.getElementById("err_store").textContent = "";
  closeModal();
}

function openModal() {
  populateCitySelect();
  storeCitySelect.value = "";
  storeKeyword.value = "";
  renderStoreResults();
  storeModal.style.display = "flex";
}
function closeModal() {
  storeModal.style.display = "none";
}

document.getElementById("openStorePicker").addEventListener("click", openModal);
f_store.addEventListener("click", openModal);
f_store.addEventListener("focus", openModal);
document.getElementById("closeStorePicker").addEventListener("click", closeModal);
storeModal.addEventListener("click", (e) => { if (e.target === storeModal) closeModal(); });
storeCitySelect.addEventListener("change", renderStoreResults);
storeKeyword.addEventListener("input", renderStoreResults);

// ---------- blacklist inline check while typing phone ----------
document.getElementById("f_phone").addEventListener("input", (e) => {
  const phone = e.target.value.trim();
  const hint = document.getElementById("blacklistHint");
  const hit = blacklist.find(b => b.phone === phone);
  if (hit) {
    hint.style.display = "block";
    hint.textContent = t("blFound").replace("{n}", hit.count);
    hint.className = "blacklist-check show warn";
  } else {
    hint.style.display = "none";
  }
});

// ---------- create order form ----------
document.getElementById("orderForm").addEventListener("submit", (e) => {
  e.preventDefault();
  clearErrors();

  const data = {
    name: document.getElementById("f_name").value.trim(),
    phone: document.getElementById("f_phone").value.trim(),
    store: document.getElementById("f_store").value.trim(),
    storeName: document.getElementById("f_store").dataset.name || "",
    storeAddr: document.getElementById("f_store").dataset.addr || "",
    product: document.getElementById("f_product").value.trim(),
    amount: document.getElementById("f_amount").value.trim(),
    ship: document.getElementById("f_ship").value.trim() || "0",
    note: document.getElementById("f_note").value.trim(),
  };

  const errors = validateOrder(data);
  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, msg]) => {
      document.getElementById("err_" + field).textContent = msg;
    });
    return;
  }

  orders.unshift({
    id: Date.now(),
    ...data,
    amount: Number(data.amount),
    ship: Number(data.ship),
    selected: false,
    createdAt: new Date().toLocaleString(),
  });
  save(DB.orders, orders);
  renderOrders();
  toast(t("toastCreated"));
  e.target.reset();
  document.getElementById("f_ship").value = "0";
  document.getElementById("blacklistHint").style.display = "none";
  delete f_store.dataset.name;
  delete f_store.dataset.addr;
  storeConfirm.style.display = "none";
});

// ---------- save as customer ----------
document.getElementById("saveCustomerBtn").addEventListener("click", () => {
  const name = document.getElementById("f_name").value.trim();
  const phone = document.getElementById("f_phone").value.trim();
  const store = document.getElementById("f_store").value.trim();
  const storeName = f_store.dataset.name || "";
  if (!name || !phone || !store) {
    toast(t("errNameLen"));
    return;
  }
  customers.unshift({ id: Date.now(), name, phone, store, storeName });
  save(DB.customers, customers);
  renderCustomers();
  renderQuickCustomers();
  toast(t("toastCustomerSaved"));
});

// ---------- quick customer chips on create form ----------
function renderQuickCustomers() {
  const wrap = document.getElementById("quickCustomers");
  wrap.innerHTML = "";
  customers.slice(0, 8).forEach(c => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = `${c.name} (${c.phone})`;
    chip.addEventListener("click", () => {
      document.getElementById("f_name").value = c.name;
      document.getElementById("f_phone").value = c.phone;
      f_store.value = c.store;
      if (c.storeName) {
        f_store.dataset.name = c.storeName;
        storeConfirm.style.display = "block";
        storeConfirm.textContent = `✓ ${c.storeName} (#${c.store})`;
      }
      document.getElementById("f_phone").dispatchEvent(new Event("input"));
    });
    wrap.appendChild(chip);
  });
}

// ---------- orders table ----------
function renderOrders() {
  const body = document.getElementById("ordersBody");
  const emptyHint = document.getElementById("ordersEmptyHint");
  body.innerHTML = "";
  emptyHint.style.display = orders.length === 0 ? "block" : "none";

  orders.forEach(o => {
    const tr = document.createElement("tr");
    const total = o.amount + o.ship;
    tr.innerHTML = `
      <td><input type="checkbox" data-id="${o.id}" class="rowchk" ${o.selected ? "checked" : ""}></td>
      <td>${escapeHtml(o.name)}</td>
      <td>${escapeHtml(o.phone)}</td>
      <td>${escapeHtml(o.storeName || "")} <span class="store-item-code">#${escapeHtml(o.store)}</span></td>
      <td>${escapeHtml(o.product)}</td>
      <td>${o.amount}</td>
      <td>${o.ship}</td>
      <td>${total}</td>
      <td><button class="btn-link del-order" data-id="${o.id}">${t("btnDelete")}</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll(".rowchk").forEach(chk => {
    chk.addEventListener("change", () => {
      const id = Number(chk.dataset.id);
      const o = orders.find(x => x.id === id);
      if (o) { o.selected = chk.checked; save(DB.orders, orders); }
    });
  });
  body.querySelectorAll(".del-order").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      orders = orders.filter(o => o.id !== id);
      save(DB.orders, orders);
      renderOrders();
      toast(t("toastDeleted"));
    });
  });
}

document.getElementById("selectAllBtn").addEventListener("click", () => {
  const allSelected = orders.length > 0 && orders.every(o => o.selected);
  orders.forEach(o => o.selected = !allSelected);
  save(DB.orders, orders);
  renderOrders();
});

function getSelectedExportRows() {
  const selected = orders.filter(o => o.selected);
  if (selected.length === 0) return null;
  const header = ["Name", "Phone", "StoreCode", "StoreName", "StoreAddress", "Product", "CODAmount", "ShippingFee", "Total", "Note", "CreatedAt"];
  const rows = selected.map(o => [
    o.name, o.phone, o.store, o.storeName || "", o.storeAddr || "", o.product, o.amount, o.ship, o.amount + o.ship, o.note || "", o.createdAt
  ]);
  return { header, rows };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const data = getSelectedExportRows();
  if (!data) { toast(t("toastNoSelect")); return; }
  const csv = [data.header, ...data.rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `orders_${Date.now()}.csv`);
  toast(t("toastExported"));
});

document.getElementById("exportXlsxBtn").addEventListener("click", () => {
  const data = getSelectedExportRows();
  if (!data) { toast(t("toastNoSelect")); return; }
  const ws = XLSX.utils.aoa_to_sheet([data.header, ...data.rows]);
  ws["!cols"] = data.header.map(() => ({ wch: 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  XLSX.writeFile(wb, `orders_${Date.now()}.xlsx`);
  toast(t("toastExported"));
});

// ---------- customers table ----------
function renderCustomers() {
  const body = document.getElementById("customersBody");
  const emptyHint = document.getElementById("customersEmptyHint");
  body.innerHTML = "";
  emptyHint.style.display = customers.length === 0 ? "block" : "none";

  customers.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.phone)}</td>
      <td>${escapeHtml(c.storeName || "")} <span class="store-item-code">#${escapeHtml(c.store)}</span></td>
      <td>
        <button class="btn-link use-customer" data-id="${c.id}">${t("btnFill")}</button>
        <button class="btn-link del-customer" data-id="${c.id}">${t("btnDelete")}</button>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll(".use-customer").forEach(btn => {
    btn.addEventListener("click", () => {
      const c = customers.find(x => x.id === Number(btn.dataset.id));
      if (!c) return;
      document.querySelector('[data-tab="create"]').click();
      document.getElementById("f_name").value = c.name;
      document.getElementById("f_phone").value = c.phone;
      f_store.value = c.store;
      if (c.storeName) {
        f_store.dataset.name = c.storeName;
        storeConfirm.style.display = "block";
        storeConfirm.textContent = `✓ ${c.storeName} (#${c.store})`;
      }
      document.getElementById("f_phone").dispatchEvent(new Event("input"));
    });
  });
  body.querySelectorAll(".del-customer").forEach(btn => {
    btn.addEventListener("click", () => {
      customers = customers.filter(c => c.id !== Number(btn.dataset.id));
      save(DB.customers, customers);
      renderCustomers();
      renderQuickCustomers();
      toast(t("toastDeleted"));
    });
  });
}

// ---------- blacklist ----------
document.getElementById("blSearchBtn").addEventListener("click", () => {
  const phone = document.getElementById("blSearch").value.trim();
  const result = document.getElementById("blResult");
  const hit = blacklist.find(b => b.phone === phone);
  if (hit) {
    result.textContent = t("blFound").replace("{n}", hit.count);
    result.className = "bl-result warn";
  } else {
    result.textContent = t("blNotFound");
    result.className = "bl-result ok";
  }
});

document.getElementById("blReportBtn").addEventListener("click", () => {
  const phone = document.getElementById("blr_phone").value.trim();
  const note = document.getElementById("blr_note").value.trim();
  if (!/^09\d{8}$/.test(phone)) {
    toast(t("errPhone"));
    return;
  }
  const existing = blacklist.find(b => b.phone === phone);
  if (existing) {
    existing.count += 1;
    if (note) existing.note = note;
  } else {
    blacklist.unshift({ phone, count: 1, note });
  }
  save(DB.blacklist, blacklist);
  renderBlacklistTable();
  document.getElementById("blr_phone").value = "";
  document.getElementById("blr_note").value = "";
  toast(t("toastReported"));
});

function renderBlacklistTable() {
  const body = document.getElementById("blacklistBody");
  body.innerHTML = "";
  blacklist.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(b.phone)}</td><td>${b.count}</td><td>${escapeHtml(b.note || "")}</td>`;
    body.appendChild(tr);
  });
}

// ---------- utils ----------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

