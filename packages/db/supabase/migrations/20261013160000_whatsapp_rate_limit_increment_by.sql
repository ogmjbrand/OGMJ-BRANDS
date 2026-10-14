-- Lets a single rate-limit check count for more than one unit — needed so
-- a bulk WhatsApp campaign send can be capped by total recipients
-- dispatched per business per hour, not by call count. Without this, a
-- campaign with thousands of contacts would pass a per-call limit (one
-- call = one campaign send) while still messaging every recipient.
--
-- Backward compatible: p_increment_by defaults to 1, matching every
-- existing caller (e.g. the ad-hoc single-send endpoint, which checks
-- "one send = one unit" and is unaffected by this change).
--
-- NOT YET APPLIED to any environment. Apply only after explicit
-- approval — the campaign-send rate limit added alongside this
-- migration will fail closed (block sends with a clear error) until
-- this function is deployed, since it calls increment_rate_limit with
-- a p_increment_by argument the currently-deployed function does not
-- accept.

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_business_id uuid,
  p_endpoint text,
  p_window_start timestamptz,
  p_limit int,
  p_increment_by int DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.api_rate_limits (business_id, endpoint, window_start, request_count)
  VALUES (p_business_id, p_endpoint, p_window_start, p_increment_by)
  ON CONFLICT (business_id, window_start, endpoint)
  DO UPDATE SET request_count = public.api_rate_limits.request_count + p_increment_by
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;
