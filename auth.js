// Supabase Auth handles passwords and sessions. The browser only receives the
// public publishable key; authorization is enforced by database RLS policies.
//
// Login/registration use phone number + password instead of email. Supabase
// expects phone numbers in E.164 format (e.g. +8869xxxxxxxx); toE164()
// converts the local 09xxxxxxxx format sellers type in. This requires the
// "Phone" provider to be enabled (with an SMS provider configured) in the
// Supabase project's Authentication settings — see README for setup notes.
const authScreen = document.getElementById("authScreen");
const appRoot = document.getElementById("app");
const userBadge = document.getElementById("userBadge");

// Taiwan mobile numbers only, matching the same rule used for order phones.
function isValidLocalPhone(phone) {
  return /^09\d{8}$/.test(phone);
}
function toE164(phone) {
  return "+886" + phone.slice(1);
}

// Holds the phone/shop name of a registration pending SMS OTP confirmation.
let pendingOtp = null;

function showAuthScreen() {
  appRoot.style.display = "none";
  authScreen.style.display = "flex";
}

function showOtpForm(phone) {
  document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
  document.getElementById("otpForm").classList.add("active");
  document.getElementById("otp_code").value = "";
  document.getElementById("otpErr").textContent = "";
}

async function getOrCreateProfile(user, shopName = "") {
  const fallbackShop = shopName || user.user_metadata?.shop_name || user.phone || "Seller";
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
  const displayPhone = user.phone ? "0" + user.phone.replace("+886", "") : user.email;
  userBadge.textContent = `${profile.shop_name} · ${displayPhone}`;
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
  const phone = document.getElementById("login_phone").value.trim();
  const password = document.getElementById("login_password").value;
  const errEl = document.getElementById("loginErr");
  errEl.textContent = "";

  if (!isValidLocalPhone(phone)) { errEl.textContent = t("authErrPhoneFormat"); return; }

  setFormBusy(form, true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ phone: toE164(phone), password });
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
  const phone = document.getElementById("reg_phone").value.trim();
  const password = document.getElementById("reg_password").value;
  const password2 = document.getElementById("reg_password2").value;
  const errEl = document.getElementById("registerErr");
  errEl.textContent = "";

  if (!shop || !phone) { errEl.textContent = t("authErrRequired"); return; }
  if (!isValidLocalPhone(phone)) { errEl.textContent = t("authErrPhoneFormat"); return; }
  if (password.length < 6) { errEl.textContent = t("authErrPasswordLen"); return; }
  if (password !== password2) { errEl.textContent = t("authErrPasswordMismatch"); return; }

  setFormBusy(form, true);
  try {
    const e164Phone = toE164(phone);
    const { data, error } = await supabaseClient.auth.signUp({
      phone: e164Phone,
      password,
      options: {
        data: { shop_name: shop },
      },
    });
    if (error) throw error;

    if (!data.session) {
      // Supabase requires SMS OTP confirmation before the account is active.
      pendingOtp = { phone: e164Phone, shop };
      toast(t("authConfirmPhone"));
      form.reset();
      showOtpForm(e164Phone);
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

document.getElementById("otpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const errEl = document.getElementById("otpErr");
  errEl.textContent = "";

  if (!pendingOtp) { errEl.textContent = t("authOtpErrInvalid"); return; }
  const token = document.getElementById("otp_code").value.trim();

  setFormBusy(form, true);
  try {
    const { data, error } = await supabaseClient.auth.verifyOtp({
      phone: pendingOtp.phone,
      token,
      type: "sms",
    });
    if (error) throw error;
    toast(t("authRegisterSuccess"));
    const shop = pendingOtp.shop;
    pendingOtp = null;
    await enterApp(data.user, shop);
  } catch (error) {
    console.error("Supabase OTP verification failed", error);
    errEl.textContent = t("authOtpErrInvalid");
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
