// Supabase Auth handles passwords and sessions. The browser only receives the
// public publishable key; authorization is enforced by database RLS policies.
const authScreen = document.getElementById("authScreen");
const appRoot = document.getElementById("app");
const userBadge = document.getElementById("userBadge");

function showAuthScreen() {
  appRoot.style.display = "none";
  authScreen.style.display = "flex";
}

async function getOrCreateProfile(user, shopName = "") {
  const fallbackShop = shopName || user.user_metadata?.shop_name || user.email?.split("@")[0] || "Seller";
  const { data: existing, error: readError } = await supabaseClient
    .from("profiles")
    .select("shop_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabaseClient
    .from("profiles")
    .insert({ user_id: user.id, shop_name: fallbackShop })
    .select("shop_name")
    .single();

  if (createError) throw createError;
  return created;
}

async function enterApp(user, shopName = "") {
  const profile = await getOrCreateProfile(user, shopName);
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
  btn.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.authtab + "Form").classList.add("active");
  });
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = document.getElementById("login_email").value.trim();
  const password = document.getElementById("login_password").value;
  const errEl = document.getElementById("loginErr");
  errEl.textContent = "";
  setFormBusy(form, true);

  try {
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

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const shop = document.getElementById("reg_shop").value.trim();
  const email = document.getElementById("reg_email").value.trim();
  const password = document.getElementById("reg_password").value;
  const password2 = document.getElementById("reg_password2").value;
  const errEl = document.getElementById("registerErr");
  errEl.textContent = "";

  if (!shop || !email) { errEl.textContent = t("authErrRequired"); return; }
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
        data: { shop_name: shop },
      },
    });
    if (error) throw error;

    if (!data.session) {
      errEl.textContent = t("authConfirmEmail");
      form.reset();
      return;
    }

    toast(t("authRegisterSuccess"));
    await enterApp(data.user, shop);
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
