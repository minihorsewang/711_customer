// Supabase Auth handles passwords and sessions. The browser only receives the
// public publishable key; authorization is enforced by database RLS policies.
//
// Accounts are identified by Email in Supabase Auth. A seller's phone number
// is stored on their profile as contact info (profiles.contact_phone), but
// the login form also accepts it as a convenience: if what's typed looks
// like a phone number, resolveEmail() calls the get_email_by_phone() RPC
// (a SECURITY DEFINER function — see supabase/migrations) to look up the
// matching email, then signs in with that as usual.
const authScreen = document.getElementById("authScreen");
const appRoot = document.getElementById("app");
const userBadge = document.getElementById("userBadge");

function isValidLocalPhone(phone) {
  return /^09\d{8}$/.test(phone);
}

function showAuthScreen() {
  appRoot.style.display = "none";
  authScreen.style.display = "flex";
}

function showAuthForm(name) {
  document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
  const tabBtn = document.querySelector(`.auth-tab-btn[data-authtab="${name}"]`);
  if (tabBtn) tabBtn.classList.add("active");
  document.getElementById(name + "Form").classList.add("active");
}

// Resolves a login identifier (email or local 09xxxxxxxx phone) to an email
// address Supabase Auth can sign in with. Returns null if a phone number
// doesn't match any registered seller.
async function resolveEmail(identifier) {
  if (identifier.includes("@")) return identifier;
  if (!isValidLocalPhone(identifier)) return null;
  const { data, error } = await supabaseClient.rpc("get_email_by_phone", { in_phone: identifier });
  if (error) { console.error("Phone lookup failed", error); return null; }
  return data || null;
}

async function getOrCreateProfile(user, shopName = "", contactPhone = "") {
  const fallbackShop = shopName || user.user_metadata?.shop_name || user.email?.split("@")[0] || "Seller";
  const { data: existing, error: readError } = await supabaseClient
    .from("profiles")
    .select("shop_name, contact_phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabaseClient
    .from("profiles")
    .insert({ user_id: user.id, shop_name: fallbackShop, contact_phone: contactPhone })
    .select("shop_name, contact_phone")
    .single();

  if (createError) throw createError;
  return created;
}

async function enterApp(user, shopName = "", contactPhone = "") {
  const profile = await getOrCreateProfile(user, shopName, contactPhone);
  authScreen.style.display = "none";
  appRoot.style.display = "block";
  userBadge.textContent = `${profile.shop_name} · ${user.email}`;
  await startApp(user.id);
}

function setFormBusy(form, busy) {
  form.querySelectorAll("input, button").forEach(element => {
    element.disabled = busy;
  });
}

document.querySelectorAll(".auth-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => showAuthForm(btn.dataset.authtab));
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const identifier = document.getElementById("login_identifier").value.trim();
  const password = document.getElementById("login_password").value;
  const errEl = document.getElementById("loginErr");
  errEl.textContent = "";
  setFormBusy(form, true);

  try {
    const email = await resolveEmail(identifier);
    if (!email) throw new Error("identifier not found");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await enterApp(data.user);
  } catch (error) {
    console.error("Supabase login failed", error);
    errEl.textContent = t("authErrBadPassword");
  } finally {
    setFormBusy(form, false);
  }
});

document.getElementById("forgotLinkBtn").addEventListener("click", () => showAuthForm("forgot"));
document.getElementById("backToLoginBtn").addEventListener("click", () => showAuthForm("login"));

document.getElementById("forgotForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const identifier = document.getElementById("forgot_identifier").value.trim();
  const errEl = document.getElementById("forgotErr");
  errEl.textContent = "";
  setFormBusy(form, true);

  try {
    const email = await resolveEmail(identifier);
    if (!email) throw new Error("identifier not found");
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    toast(t("authForgotSent"));
    form.reset();
    showAuthForm("login");
  } catch (error) {
    console.error("Password reset request failed", error);
    errEl.textContent = t("authForgotErrNotFound");
  } finally {
    setFormBusy(form, false);
  }
});

document.getElementById("resetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const password = document.getElementById("reset_password").value;
  const password2 = document.getElementById("reset_password2").value;
  const errEl = document.getElementById("resetErr");
  errEl.textContent = "";

  if (password.length < 6) { errEl.textContent = t("authErrPasswordLen"); return; }
  if (password !== password2) { errEl.textContent = t("authErrPasswordMismatch"); return; }

  setFormBusy(form, true);
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ password });
    if (error) throw error;
    toast(t("authResetSuccess"));
    form.reset();
    await enterApp(data.user);
  } catch (error) {
    console.error("Password update failed", error);
    errEl.textContent = t("authErrGeneral");
  } finally {
    setFormBusy(form, false);
  }
});

// Supabase fires this once it has parsed a password-recovery link from the
// URL (detectSessionInUrl: true in supabase-config.js) and established a
// temporary recovery session — show the "set new password" form instead of
// the normal app.
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    appRoot.style.display = "none";
    authScreen.style.display = "flex";
    showAuthForm("reset");
  }
});

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const shop = document.getElementById("reg_shop").value.trim();
  const email = document.getElementById("reg_email").value.trim();
  const phone = document.getElementById("reg_phone").value.trim();
  const password = document.getElementById("reg_password").value;
  const password2 = document.getElementById("reg_password2").value;
  const errEl = document.getElementById("registerErr");
  errEl.textContent = "";

  if (!shop || !email || !phone) { errEl.textContent = t("authErrRequired"); return; }
  if (!isValidLocalPhone(phone)) { errEl.textContent = t("authErrPhoneFormat"); return; }
  if (password.length < 6) { errEl.textContent = t("authErrPasswordLen"); return; }
  if (password !== password2) { errEl.textContent = t("authErrPasswordMismatch"); return; }

  setFormBusy(form, true);
  try {
    const emailRedirectTo = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { shop_name: shop, contact_phone: phone },
      },
    });
    if (error) throw error;

    if (!data.session) {
      errEl.textContent = t("authConfirmEmail");
      form.reset();
      return;
    }

    toast(t("authRegisterSuccess"));
    await enterApp(data.user, shop, phone);
  } catch (error) {
    console.error("Supabase registration failed", error);
    errEl.textContent = error?.message?.toLowerCase().includes("already")
      ? t("authErrExists")
      : t("authErrGeneral");
  } finally {
    setFormBusy(form, false);
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error("Supabase logout failed", error);
    toast(t("authErrGeneral"));
    return;
  }
  showAuthScreen();
});

// Guest preview intentionally stays local and never writes demo data to cloud.
document.getElementById("guestBtn").addEventListener("click", async () => {
  authScreen.style.display = "none";
  appRoot.style.display = "block";
  userBadge.textContent = `${t("authGuestShopName")} · guest@local`;
  await startApp("guest", { guest: true });
});

(async function boot() {
  applyI18n();
  showAuthScreen();

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (session?.user) await enterApp(session.user);
  } catch (error) {
    console.error("Unable to restore Supabase session", error);
    document.getElementById("loginErr").textContent = t("authErrGeneral");
  }
})();
