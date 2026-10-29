-- Libera reservas vencidas y marca cosechas expiradas cada 15 minutos
create extension if not exists pg_cron;
select cron.schedule('expire-stale', '*/15 * * * *', $$select public.expire_stale()$$);
