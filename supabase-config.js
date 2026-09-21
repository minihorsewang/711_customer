// Supabase 的 Project URL 與 Publishable Key 是設計給公開前端使用的識別資訊。
// 高權限的 Secret Key / service_role 絕對不可放在這個檔案或 GitHub。
const SUPABASE_URL = "https://sofixqjutqekcxbmvvun.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_worzIEeiP-9qAb5O4qbBxA_JjROC_1y";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
