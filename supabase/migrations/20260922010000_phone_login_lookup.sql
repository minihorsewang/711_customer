-- Lets the (unauthenticated) login form accept a phone number in place of
-- an email: it resolves the phone to its owner's email so the client can
-- call signInWithPassword({ email, password }) as usual. Runs as
-- SECURITY DEFINER to read across profiles/auth.users despite RLS, but only
-- ever returns an email (never a password or other profile data), and is
-- exposed to anon/authenticated only through this narrow function.
create or replace function public.get_email_by_phone(in_phone text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select users.email
  from public.profiles profiles_row
  join auth.users users on users.id = profiles_row.user_id
  where profiles_row.contact_phone = in_phone
  limit 1;
$$;

revoke all on function public.get_email_by_phone(text) from public;
grant execute on function public.get_email_by_phone(text) to anon, authenticated;
