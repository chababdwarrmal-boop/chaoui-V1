-- Harden group tournament advancement so anonymous or unrelated users cannot trigger it.
CREATE OR REPLACE FUNCTION public.advance_group_tournament(p_tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  t public.tournaments%rowtype;
  current_count integer;
  finished_count integer;
  total_count integer;
  top_ids uuid[];
  n integer;
  i integer;
  reward integer;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into t from public.tournaments where id=p_tournament_id for update;
  if not found or t.format not in ('groups','groups_knockout') then return false; end if;
  if not (
    t.organizer_id=uid or public.is_owner()
    or exists(select 1 from public.tournament_players tp where tp.tournament_id=p_tournament_id and tp.player_id=uid and tp.status='accepted')
  ) then raise exception 'NOT_ALLOWED'; end if;

  select count(*), count(*) filter (where status='finished')
    into total_count, finished_count
    from public.matches where tournament_id=p_tournament_id and round='G1';
  if total_count=0 or finished_count<>total_count then return false; end if;

  if t.format='groups' then
    select array_agg(player_id order by pts desc,wins desc,goal_diff desc,player_id) into top_ids
    from (
      select p.id as player_id,
        coalesce(sum(case when m.winner_id=p.id then 3 when m.winner_id is null and m.status='finished' then 1 else 0 end),0) as pts,
        coalesce(sum(case when m.winner_id=p.id then 1 else 0 end),0) as wins,
        coalesce(sum(case when m.player_a=p.id then m.score_a-m.score_b else m.score_b-m.score_a end),0) as goal_diff
      from public.tournament_players tp join public.profiles p on p.id=tp.player_id
      left join public.matches m on m.tournament_id=p_tournament_id and m.round='G1' and (m.player_a=p.id or m.player_b=p.id)
      where tp.tournament_id=p_tournament_id and tp.status='accepted' group by p.id
    ) q;
    if coalesce(array_length(top_ids,1),0)=0 then return false; end if;
    reward:=coalesce((select tournament_win_reward from public.coin_settings where id=1),100);
    update public.tournaments set status='done',updated_at=now() where id=p_tournament_id;
    if not exists(select 1 from public.hall_of_fame where tournament_name=t.name and champion_id=top_ids[1]) then
      insert into public.hall_of_fame(tournament_name,champion_id,season,avatar) values(t.name,top_ids[1],'CHAOUI 2026','C');
    end if;
    update public.profiles set coins=coins+reward,updated_at=now() where id=top_ids[1];
    insert into public.progression_events(player_id,event_type,title,description,coins_delta) values(top_ids[1],'match','🏆 Champion Reward','ربح بطولة '||t.name,reward);
    insert into public.notifications(user_id,title,message) values(top_ids[1],'🏆 بطل البطولة','ربحتي بطولة '||t.name||'! + '||reward||' Coins 🔥');
    return true;
  end if;

  if exists(select 1 from public.matches where tournament_id=p_tournament_id and round like 'R%') then return true; end if;
  select array_agg(player_id order by pts desc,wins desc,goal_diff desc,player_id) into top_ids
  from (
    select p.id as player_id,
      coalesce(sum(case when m.winner_id=p.id then 3 when m.winner_id is null and m.status='finished' then 1 else 0 end),0) as pts,
      coalesce(sum(case when m.winner_id=p.id then 1 else 0 end),0) as wins,
      coalesce(sum(case when m.player_a=p.id then m.score_a-m.score_b else m.score_b-m.score_a end),0) as goal_diff
    from public.tournament_players tp join public.profiles p on p.id=tp.player_id
    left join public.matches m on m.tournament_id=p_tournament_id and m.round='G1' and (m.player_a=p.id or m.player_b=p.id)
    where tp.tournament_id=p_tournament_id and tp.status='accepted' group by p.id
  ) q;
  n:=least(coalesce(array_length(top_ids,1),0),4);
  if n<2 then return false; end if;
  if mod(n,2)<>0 then n:=n-1; end if;
  i:=1;
  while i<=n loop
    insert into public.matches(tournament_id,player_a,player_b,round,scheduled_at,status) values(p_tournament_id,top_ids[i],top_ids[i+1],'R1',now(),'scheduled');
    i:=i+2;
  end loop;
  update public.tournaments set status='live',updated_at=now() where id=p_tournament_id;
  return true;
end;
$function$;