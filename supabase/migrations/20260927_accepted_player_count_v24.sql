-- V24 follow-up: current_players counts accepted participants only
create or replace function public.sync_tournament_count()
returns trigger
language plpgsql
security definer set search_path=public as $function$
begin
  if tg_op='INSERT' then
    if new.status='accepted' then
      update public.tournaments
      set current_players=coalesce(current_players,0)+1,updated_at=now()
      where id=new.tournament_id;
    end if;
  elsif tg_op='UPDATE' then
    if old.status='accepted' and new.status<>'accepted' then
      update public.tournaments
      set current_players=greatest(coalesce(current_players,0)-1,0),updated_at=now()
      where id=new.tournament_id;
    elsif old.status<>'accepted' and new.status='accepted' then
      update public.tournaments
      set current_players=coalesce(current_players,0)+1,updated_at=now()
      where id=new.tournament_id;
    end if;
  elsif tg_op='DELETE' then
    if old.status='accepted' then
      update public.tournaments
      set current_players=greatest(coalesce(current_players,0)-1,0),updated_at=now()
      where id=old.tournament_id;
    end if;
  end if;
  return null;
end;$function$;

update public.tournaments t
set current_players=(select count(*) from public.tournament_players tp where tp.tournament_id=t.id and tp.status='accepted'),
    updated_at=now();