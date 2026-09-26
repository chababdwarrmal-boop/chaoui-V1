-- Remove implicit PUBLIC execute on exposed SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION public.advance_group_tournament(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_profile_social_counts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.social_notify_comment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.social_notify_follow() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.social_notify_like() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_profile_follow(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_social_profile(text,text,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_coin_streak() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_player_power(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.advance_group_tournament(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_profile_follow(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_social_profile(text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_coin_streak() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_player_power(uuid) TO authenticated;