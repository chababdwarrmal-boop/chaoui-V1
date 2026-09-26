-- CHAoui V18 audit hardening
-- 1) SECURITY DEFINER RPCs must never be callable by anonymous clients.
REVOKE EXECUTE ON FUNCTION public.advance_group_tournament(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_coin_streak() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_player_power(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_profile_social_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.social_notify_comment() FROM anon;
REVOKE EXECUTE ON FUNCTION public.social_notify_follow() FROM anon;
REVOKE EXECUTE ON FUNCTION public.social_notify_like() FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_profile_follow(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_social_profile(text,text,text,text) FROM anon;

-- 2) Explicit search_path for the non-definer helper flagged by Supabase.
ALTER FUNCTION public.toggle_social_like(uuid) SET search_path = public;

-- 3) Cover foreign keys identified by Supabase performance advisor.
CREATE INDEX IF NOT EXISTS idx_champions_league_entries_player_id ON public.champions_league_entries(player_id);
CREATE INDEX IF NOT EXISTS idx_champions_league_seasons_champion_id ON public.champions_league_seasons(champion_id);
CREATE INDEX IF NOT EXISTS idx_match_of_week_match_id ON public.match_of_week(match_id);
CREATE INDEX IF NOT EXISTS idx_power_history_player_id ON public.power_history(player_id);
CREATE INDEX IF NOT EXISTS idx_profile_follows_following_id ON public.profile_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_opponent_id ON public.rating_history(opponent_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_actor_id ON public.social_notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_post_id ON public.social_notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_comments_user_id ON public.social_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_likes_user_id ON public.social_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_saves_user_id ON public.social_post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_author_id ON public.social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_match_id ON public.social_posts(match_id);
CREATE INDEX IF NOT EXISTS idx_social_story_views_user_id ON public.social_story_views(user_id);
