alter table public.profiles
  add column if not exists contact_phone text not null default '' check (contact_phone = '' or contact_phone ~ '^09[0-9]{8}$');
