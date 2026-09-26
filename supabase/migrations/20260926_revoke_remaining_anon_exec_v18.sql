-- CREATE OR REPLACE can restore default EXECUTE grants; keep the hardened ACL explicit.
REVOKE EXECUTE ON FUNCTION public.advance_group_tournament(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_profile_social_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.social_notify_comment() FROM anon;
REVOKE EXECUTE ON FUNCTION public.social_notify_follow() FROM anon;
REVOKE EXECUTE ON FUNCTION public.social_notify_like() FROM anon;