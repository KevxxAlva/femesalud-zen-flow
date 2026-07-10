-- Auto-cancel appointments that are overdue by more than 15 minutes

-- 1. Try to enable the pg_cron extension safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not install pg_cron extension: %', SQLERRM;
END;
$$;

-- 2. Create the function to cancel overdue appointments
CREATE OR REPLACE FUNCTION public.cancel_overdue_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.appointments
  SET status = 'cancelada',
      updated_at = now()
  WHERE status = 'programada'
    AND scheduled_at < (now() - interval '15 minutes');
END;
$$;

-- 3. Schedule the cron job if pg_cron is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    -- Unscheduling existing job if it exists to prevent duplicate schedules
    PERFORM cron.unschedule('cancel-overdue-appointments');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.schedule('cancel-overdue-appointments', '*/1 * * * *', 'SELECT public.cancel_overdue_appointments()');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule pg_cron job: %', SQLERRM;
END;
$$;
