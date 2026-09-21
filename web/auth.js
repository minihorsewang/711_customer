// ---------------------------------------------------------------------
// Demo authentication (prototype only).
// Accounts are stored in the browser's localStorage — there is no real
// backend yet, so passwords are NOT securely hashed. This exists only
// to demonstrate the multi-seller (multi-tenant) UX: each registered
// shop gets its own isolated orders/customers/blacklist data via
// startApp(sellerId) in app.js. A production build must replace this
// with a real backend + proper password hashing (e.g. bcrypt) and
// session tokens.
// ---------------------------------------------------------------------

const AUTH_USERS_KEY = "tdn_users";
const AUTH_SESSION_KEY = "tdn_session";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || []; }
  catch (e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

// Not real security — just avoids storing raw passwords in plain text
// for this client-only prototype.
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return String(hash);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function findUser(email) {
  return loadUsers().find(u => u.email === normalizeEmail(email));
}

function registerUser(shop, email, password) {
  const users = loadUsers();
  const normEmail = normalizeEmail(email);
  if (users.some(u => u.email === normEmail)) {
    return { ok: false, error: "exists" };
  }
  const user = {
    id: "u" + Date.now(),
    shop,
    email: normEmail,
    passwordHash: simpleHash(password),
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

function verifyLogin(email, password) {
  const user = findUser(email);
  if (!user) return { ok: false, error: "notfound" };
  if (user.passwordHash !== simpleHash(password)) return { ok: false, error: "badpassword" };
  return { ok: true, user };
}

function setSession(user) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ id: user.id, email: user.email, shop: user.shop }));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)); }
  catch (e) { return null; }
}
function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

// ---------- UI wiring ----------
const authScreen = document.getElementById("authScreen");
const appRoot = document.getElementById("app");
const userBadge = document.getElementById("userBadge");

function enterApp(user) {
  authScreen.style.display = "none";
  appRoot.style.display = "block";
  userBadge.textContent = `${user.shop} · ${user.email}`;
  startApp(user.id);
}

function showAuthScreen() {
  appRoot.style.display = "none";
  authScreen.style.display = "flex";
}

// auth tabs (login / register)
document.querySelectorAll(".auth-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.authtab + "Form").classList.add("active");
  });
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login_email").value;
  const password = document.getElementById("login_password").value;
  const errEl = document.getElementById("loginErr");
  errEl.textContent = "";

  const result = verifyLogin(email, password);
  if (!result.ok) {
    errEl.textContent = result.error === "notfound" ? t("authErrNotFound") : t("authErrBadPassword");
    return;
  }
  setSession(result.user);
  enterApp(result.user);
});

document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const shop = document.getElementById("reg_shop").value.trim();
  const email = document.getElementById("reg_email").value.trim();
  const password = document.getElementById("reg_password").value;
  const password2 = document.getElementById("reg_password2").value;
  const errEl = document.getElementById("registerErr");
  errEl.textContent = "";

  if (!shop || !email) { errEl.textContent = t("authErrRequired"); return; }
  if (password.length < 6) { errEl.textContent = t("authErrPasswordLen"); return; }
  if (password !== password2) { errEl.textContent = t("authErrPasswordMismatch"); return; }

  const result = registerUser(shop, email, password);
  if (!result.ok) {
    errEl.textContent = t("authErrExists");
    return;
  }
  setSession(result.user);
  toast(t("authRegisterSuccess"));
  enterApp(result.user);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  showAuthScreen();
});

// Guest preview: skip login entirely and jump straight into the app
// with a fixed local demo account, so pages can be checked without
// registering. Not a real session — logging out returns to auth screen.
document.getElementById("guestBtn").addEventListener("click", () => {
  const guestUser = { id: "guest", shop: t("authGuestShopName"), email: "guest@local" };
  enterApp(guestUser);
});

// ---------- boot ----------
(function boot() {
  const session = getSession();
  if (session) {
    const user = findUser(session.email);
    if (user) { enterApp(user); return; }
  }
  applyI18n();
  showAuthScreen();
})();
