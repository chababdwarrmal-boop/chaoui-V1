-- CHAoui tournament registration workflow V11
alter table public.tournament_players
  add column if not exists registration_name text,
  add column if not exists registration_whatsapp text,
  add column if not exists registration_efootball_name text,
  add column if not exists registration_type text,
  add column if not exists preferred_time text,
  add column if not exists connection_type text,
  add column if not exists prior_participation boolean not null default false,
  add column if not exists commitment_confirmed boolean not null default false,
  add column if not exists rules_accepted boolean not null default false,
  add column if not exists registration_note text;

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
declare uid uuid:=auth.uid(); t public.tournaments%rowtype; p public.profiles%rowtype; existing public.tournament_players%rowtype; join_status text;
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
 select * into existing from public.tournament_players where tournament_id=p_tournament_id and player_id=uid limit 1; if found then return existing.status; end if;
 if coalesce(t.current_players,0)<coalesce(t.capacity,0) then join_status:='accepted'; else join_status:='waitlist'; end if;
 insert into public.tournament_players(tournament_id,player_id,status,registration_name,registration_whatsapp,registration_efootball_name,registration_type,preferred_time,connection_type,prior_participation,commitment_confirmed,rules_accepted,registration_note)
 values(p_tournament_id,uid,join_status,trim(p_registration_name),trim(p_registration_whatsapp),trim(p_registration_efootball_name),p_registration_type,trim(p_preferred_time),p_connection_type,coalesce(p_prior_participation,false),coalesce(p_commitment_confirmed,false),coalesce(p_rules_accepted,false),nullif(trim(coalesce(p_registration_note,'')),''));
 return join_status;
end;$function$;

revoke execute on function public.join_tournament_with_registration(uuid,text,text,text,text,text,text,boolean,boolean,boolean,text) from public, anon, authenticated;
grant execute on function public.join_tournament_with_registration(uuid,text,text,text,text,text,text,boolean,boolean,boolean,text) to authenticated;