create or replace function public.instantly_approve_seller_application()
returns trigger
language plpgsql
security definer
set search_path = '' as $$
begin
  update public.seller_applications
  set status = 'approved',
      admin_note = 'Aprovim automatik',
      reviewed_at = now(),
      updated_at = now()
  where user_id = new.user_id;

  update public.profiles
  set seller_verified = true,
      updated_at = now()
  where id = new.user_id;

  return new;
end;
$$;

revoke all on function public.instantly_approve_seller_application() from public, anon, authenticated;

drop trigger if exists instantly_approve_seller_application on public.seller_applications;
create trigger instantly_approve_seller_application
after insert or update of status on public.seller_applications
for each row
when (new.status = 'pending')
execute function public.instantly_approve_seller_application();
