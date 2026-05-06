
alter function public.touch_updated_at() set search_path = public;

revoke execute on function public.has_role(uuid, app_role) from anon;
revoke execute on function public.is_project_member(uuid, uuid) from anon;
revoke execute on function public.claim_admin_if_none() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
