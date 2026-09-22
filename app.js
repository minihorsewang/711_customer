// ---------- data access ----------
// Signed-in sellers use Supabase. Guest preview stays in localStorage so demo
// data never enters the production database.
let isGuestMode = false;
let currentSellerId = null;
const GUEST_DB = {
  orders: "tdn_guest_orders",
  customers: "tdn_guest_customers",
  blacklist: "tdn_guest_blacklist",
};

let orders = [];
let customers = [];
let blacklist = [];

function loadGuest(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (error) { return []; }
}

function saveGuest(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function mapOrder(row) {
  return {
    id: Number(row.id),
    name: row.receiver_name,
    phone: row.phone,
    store: row.store_code,
    storeName: row.store_name,
    storeAddr: row.store_address,
    product: row.product,
    amount: row.amount,
    ship: row.shipping_fee,
    note: row.note,
    selected: false,
    createdAt: new Date(row.created_at).toLocaleString(),
  };
}

function mapCustomer(row) {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    store: row.store_code,
    storeName: row.store_name,
    storeAddr: row.store_address,
  };
}

function mapBlacklist(row) {
  return {
    id: Number(row.id),
    phone: row.phone,
    count: row.report_count,
    note: row.note,
  };
}

async function loadCloudData() {
  const [ordersResult, customersResult, blacklistResult] = await Promise.all([
    supabaseClient.from("orders").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("customers").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("blacklist_reports").select("*").order("updated_at", { ascending: false }),
  ]);

  const firstError = ordersResult.error || customersResult.error || blacklistResult.error;
  if (firstError) throw firstError;

  orders = ordersResult.data.map(mapOrder);
  customers = customersResult.data.map(mapCustomer);
  blacklist = blacklistResult.data.map(mapBlacklist);
}

async function startApp(sellerId, options = {}) {
  currentSellerId = sellerId;
  isGuestMode = Boolean(options.guest);

  if (isGuestMode) {
    orders = loadGuest(GUEST_DB.orders);
    customers = loadGuest(GUEST_DB.customers);
    blacklist = loadGuest(GUEST_DB.blacklist);
    if (blacklist.length === 0) {
      blacklist = [{ id: Date.now(), phone: "0900000000", count: 3, note: "多次未取件" }];
      saveGuest(GUEST_DB.blacklist, blacklist);
    }
  } else {
    await loadCloudData();
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
// UI mirrors the official 7-ELEVEN electronic map (emap.pcsc.com.tw):
// 街道名稱 (browse by city) / 門市名稱 (by store name) / 門市店號 (by code)
// tabs. STORE_DB in stores.js is still demo data — see README for what a
// real integration (ECPay's 門市電子地圖 API) requires.
const storeModal = document.getElementById("storeModal");
const storeResults = document.getElementById("storeResults");
const storeConfirm = document.getElementById("storeConfirm");
const f_store = document.getElementById("f_store");

const storeCityGrid = document.getElementById("storeCityGrid");
const storeStreetHint = document.getElementById("storeStreetHint");
const storeNameInput = document.getElementById("storeNameInput");
const storeNameResults = document.getElementById("storeNameResults");
const storeCodeInput = document.getElementById("storeCodeInput");
const storeCodeResults = document.getElementById("storeCodeResults");

function renderStoreList(container, results, opts = {}) {
  container.innerHTML = "";
  if (results.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-hint";
    p.textContent = opts.emptyText || t("storeNoResults");
    container.appendChild(p);
    return;
  }
  results.forEach(s => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "store-item";
    item.innerHTML = `
      <div class="store-item-name">${escapeHtml(s.name)} <span class="store-item-code">#${s.code}</span></div>
      <div class="store-item-addr">${escapeHtml(s.addr)}</div>
    `;
    item.addEventListener("click", () => selectStore(s));
    container.appendChild(item);
  });
}

function populateCityGrid() {
  storeCityGrid.innerHTML = "";
  ALL_TAIWAN_CITIES.forEach(city => {
    const hasData = STORE_CITIES.includes(city);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "store-city-btn" + (hasData ? "" : " disabled");
    btn.textContent = city;
    if (hasData) {
      btn.addEventListener("click", () => selectCity(city));
    } else {
      btn.disabled = true;
      btn.title = t("storeCityNoData");
    }
    storeCityGrid.appendChild(btn);
  });
}

function selectCity(city) {
  document.querySelectorAll(".store-city-btn").forEach(b => {
    b.classList.toggle("active", b.textContent === city);
  });
  storeStreetHint.style.display = "none";
  const results = searchStores({ city, keyword: "" });
  renderStoreList(storeResults, results);
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

function showStoreTab(name) {
  document.querySelectorAll(".store-map-tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".store-panel").forEach(p => p.classList.remove("active"));
  document.querySelector(`.store-map-tab[data-storetab="${name}"]`).classList.add("active");
  document.getElementById("storePanel" + name.charAt(0).toUpperCase() + name.slice(1)).classList.add("active");
}

document.querySelectorAll(".store-map-tab").forEach(btn => {
  btn.addEventListener("click", () => showStoreTab(btn.dataset.storetab));
});

document.getElementById("storeNameSearchBtn").addEventListener("click", () => {
  renderStoreList(storeNameResults, searchStoresByName(storeNameInput.value));
});
storeNameInput.addEventListener("input", () => {
  renderStoreList(storeNameResults, searchStoresByName(storeNameInput.value));
});

document.getElementById("storeCodeSearchBtn").addEventListener("click", () => {
  renderStoreList(storeCodeResults, searchStoresByCode(storeCodeInput.value));
});
storeCodeInput.addEventListener("input", () => {
  renderStoreList(storeCodeResults, searchStoresByCode(storeCodeInput.value));
});

function openModal() {
  populateCityGrid();
  storeStreetHint.style.display = "block";
  storeResults.innerHTML = "";
  storeNameInput.value = "";
  storeNameResults.innerHTML = "";
  storeCodeInput.value = "";
  storeCodeResults.innerHTML = "";
  showStoreTab("street");
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
document.getElementById("orderForm").addEventListener("submit", async (e) => {
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

  try {
    if (isGuestMode) {
      orders.unshift({
        id: Date.now(),
        ...data,
        amount: Number(data.amount),
        ship: Number(data.ship),
        selected: false,
        createdAt: new Date().toLocaleString(),
      });
      saveGuest(GUEST_DB.orders, orders);
    } else {
      const { data: created, error } = await supabaseClient
        .from("orders")
        .insert({
          seller_id: currentSellerId,
          receiver_name: data.name,
          phone: data.phone,
          store_code: data.store,
          store_name: data.storeName,
          store_address: data.storeAddr,
          product: data.product,
          amount: Number(data.amount),
          shipping_fee: Number(data.ship),
          note: data.note,
        })
        .select("*")
        .single();
      if (error) throw error;
      orders.unshift(mapOrder(created));
    }
  } catch (error) {
    console.error("Unable to create order", error);
    toast(t("toastCloudError"));
    return;
  }

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
document.getElementById("saveCustomerBtn").addEventListener("click", async () => {
  const name = document.getElementById("f_name").value.trim();
  const phone = document.getElementById("f_phone").value.trim();
  const store = document.getElementById("f_store").value.trim();
  const storeName = f_store.dataset.name || "";
  if (!name || !phone || !store) {
    toast(t("errNameLen"));
    return;
  }
  try {
    if (isGuestMode) {
      customers.unshift({ id: Date.now(), name, phone, store, storeName, storeAddr: f_store.dataset.addr || "" });
      saveGuest(GUEST_DB.customers, customers);
    } else {
      const { data: created, error } = await supabaseClient
        .from("customers")
        .insert({
          seller_id: currentSellerId,
          name,
          phone,
          store_code: store,
          store_name: storeName,
          store_address: f_store.dataset.addr || "",
        })
        .select("*")
        .single();
      if (error) throw error;
      customers.unshift(mapCustomer(created));
    }
  } catch (error) {
    console.error("Unable to save customer", error);
    toast(t("toastCloudError"));
    return;
  }

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
      if (o) o.selected = chk.checked;
    });
  });
  body.querySelectorAll(".del-order").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      try {
        if (isGuestMode) {
          orders = orders.filter(o => o.id !== id);
          saveGuest(GUEST_DB.orders, orders);
        } else {
          const { error } = await supabaseClient.from("orders").delete().eq("id", id);
          if (error) throw error;
          orders = orders.filter(o => o.id !== id);
        }
      } catch (error) {
        console.error("Unable to delete order", error);
        toast(t("toastCloudError"));
        return;
      }
      renderOrders();
      toast(t("toastDeleted"));
    });
  });
}

document.getElementById("selectAllBtn").addEventListener("click", () => {
  const allSelected = orders.length > 0 && orders.every(o => o.selected);
  orders.forEach(o => o.selected = !allSelected);
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
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      try {
        if (isGuestMode) {
          customers = customers.filter(c => c.id !== id);
          saveGuest(GUEST_DB.customers, customers);
        } else {
          const { error } = await supabaseClient.from("customers").delete().eq("id", id);
          if (error) throw error;
          customers = customers.filter(c => c.id !== id);
        }
      } catch (error) {
        console.error("Unable to delete customer", error);
        toast(t("toastCloudError"));
        return;
      }
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

document.getElementById("blReportBtn").addEventListener("click", async () => {
  const phone = document.getElementById("blr_phone").value.trim();
  const note = document.getElementById("blr_note").value.trim();
  if (!/^09\d{8}$/.test(phone)) {
    toast(t("errPhone"));
    return;
  }
  const existing = blacklist.find(b => b.phone === phone);
  try {
    if (isGuestMode) {
      if (existing) {
        existing.count += 1;
        if (note) existing.note = note;
      } else {
        blacklist.unshift({ id: Date.now(), phone, count: 1, note });
      }
      saveGuest(GUEST_DB.blacklist, blacklist);
    } else if (existing) {
      const { data: updated, error } = await supabaseClient
        .from("blacklist_reports")
        .update({
          report_count: existing.count + 1,
          note: note || existing.note || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      Object.assign(existing, mapBlacklist(updated));
    } else {
      const { data: created, error } = await supabaseClient
        .from("blacklist_reports")
        .insert({ seller_id: currentSellerId, phone, report_count: 1, note })
        .select("*")
        .single();
      if (error) throw error;
      blacklist.unshift(mapBlacklist(created));
    }
  } catch (error) {
    console.error("Unable to report blacklist entry", error);
    toast(t("toastCloudError"));
    return;
  }

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
