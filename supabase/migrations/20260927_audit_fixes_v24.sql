-- CHAoui V24 audit fixes
create or replace function public.join_tournament_with_registration(
  p_tournament_id uuid,
  p_registration_name text,
  p_registration_whatsapp text,
  p_registration_efootball_name text,
  p_registration_type text,
  p_preferred_time text,
  p_connection_type text,
  p_prior_participation boolean,
  p_commitment_confirmed boolean,
  p_rules_accepted boolean,
  p_registration_note text default null
) returns text
language plpgsql security definer set search_path=public as $function$
declare
  uid uuid:=auth.uid();
  t public.tournaments%rowtype;
  p public.profiles%rowtype;
  existing public.tournament_players%rowtype;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if coalesce(trim(p_registration_name),'')='' then raise exception 'REGISTRATION_NAME_REQUIRED'; end if;
  if coalesce(trim(p_registration_efootball_name),'')='' then raise exception 'EFOOTBALL_NAME_REQUIRED'; end if;
  if coalesce(trim(p_registration_whatsapp),'')='' then raise exception 'WHATSAPP_REQUIRED'; end if;
  if coalesce(p_registration_type,'') not in ('free','premium') then raise exception 'REGISTRATION_TYPE_INVALID'; end if;
  if coalesce(trim(p_preferred_time),'')='' then raise exception 'PREFERRED_TIME_REQUIRED'; end if;
  if coalesce(p_connection_type,'') not in ('wifi','conix') then raise exception 'CONNECTION_TYPE_REQUIRED'; end if;
  if not coalesce(p_commitment_confirmed,false) then raise exception 'COMMITMENT_REQUIRED'; end if;
  if not coalesce(p_rules_accepted,false) then raise exception 'RULES_REQUIRED'; end if;
  select * into p from public.profiles where id=uid; if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  select * into t from public.tournaments where id=p_tournament_id for update; if not found then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  if t.status<>'open' then raise exception 'REGISTRATION_CLOSED'; end if;
  if exists(select 1 from public.app_settings where id=1 and (join_enabled=false or maintenance=true)) then raise exception 'JOIN_DISABLED'; end if;
  if t.entry_type='premium' and p.role<>'owner' and not coalesce(p.premium,false) then raise exception 'PREMIUM_REQUIRED'; end if;
  if p_registration_type='premium' and p.role<>'owner' and not coalesce(p.premium,false) then raise exception 'PREMIUM_PROFILE_REQUIRED'; end if;
  select * into existing from public.tournament_players where tournament_id=p_tournament_id and player_id=uid limit 1;
  if found then return existing.status; end if;
  insert into public.tournament_players(
    tournament_id,player_id,status,registration_name,registration_whatsapp,registration_efootball_name,
    registration_type,preferred_time,connection_type,prior_participation,commitment_confirmed,rules_accepted,registration_note
  ) values(
    p_tournament_id,uid,'pending',trim(p_registration_name),trim(p_registration_whatsapp),trim(p_registration_efootball_name),
    p_registration_type,trim(p_preferred_time),p_connection_type,coalesce(p_prior_participation,false),true,true,
    nullif(trim(coalesce(p_registration_note,'')),'')
  );
  return 'pending';
end;$function$;

create or replace function public.review_tournament_registration(
  p_registration_id uuid,p_decision text
) returns text
language plpgsql security definer set search_path=public as $function$
declare
  uid uuid:=auth.uid();
  row public.tournament_players%rowtype;
  t public.tournaments%rowtype;
  accepted_count integer;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_decision not in ('accepted','waitlist','rejected') then raise exception 'INVALID_DECISION'; end if;
  select * into row from public.tournament_players where id=p_registration_id for update;
  if not found then raise exception 'REGISTRATION_NOT_FOUND'; end if;
  select * into t from public.tournaments where id=row.tournament_id for update;
  if not found then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  if not (t.organizer_id=uid or public.is_owner()) then raise exception 'NOT_ALLOWED'; end if;
  if row.status=p_decision then return row.status; end if;
  if p_decision='accepted' then
    select count(*) into accepted_count from public.tournament_players
    where tournament_id=row.tournament_id and status='accepted' and id<>row.id;
    if accepted_count>=coalesce(t.capacity,0) then raise exception 'CAPACITY_REACHED'; end if;
  end if;
  update public.tournament_players set status=p_decision,updated_at=now() where id=row.id;
  insert into public.notifications(user_id,title,message,read) values(
    row.player_id,
    case p_decision when 'accepted' then '✅ تم قبول تسجيلك' when 'waitlist' then '🕒 تمت إضافتك للائحة الانتظار' else '❌ لم يتم قبول التسجيل' end,
    case p_decision when 'accepted' then 'تم قبول تسجيلك فـ «'||t.name||'». تابع المباريات من حسابك.'
      when 'waitlist' then 'تم وضع تسجيلك فـ لائحة الانتظار ديال «'||t.name||'».'
      else 'تسجيلك فـ «'||t.name||'» ما تقبلش هاد المرة.' end,
    false
  );
  return p_decision;
end;$function$;

revoke execute on function public.join_tournament_with_registration(uuid,text,text,text,text,text,text,boolean,boolean,boolean,text) from public,anon,authenticated;
grant execute on function public.join_tournament_with_registration(uuid,text,text,text,text,text,text,boolean,boolean,boolean,text) to authenticated;

revoke execute on function public.review_tournament_registration(uuid,text) from public,anon,authenticated;
grant execute on function public.review_tournament_registration(uuid,text) to authenticated;

drop policy if exists matches_select_own_or_owner on public.matches;
create policy matches_select_own_or_owner on public.matches
for select to authenticated using (
  player_a=auth.uid()
  or player_b=auth.uid()
  or is_owner()
  or exists (
    select 1 from public.tournaments t
    where t.id=matches.tournament_id and t.organizer_id=auth.uid()
  )
);