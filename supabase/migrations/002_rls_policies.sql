-- OGMJ BRANDS — Row-Level Security (RLS) Policies
-- Last Updated: April 17, 2026
-- ================================
-- ENABLE RLS ON ALL TABLES
-- ================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
-- ================================
-- HELPER FUNCTIONS
-- ================================
-- Get current user's role for a business
CREATE OR REPLACE FUNCTION get_user_role(p_business_id UUID) RETURNS VARCHAR AS $$ BEGIN RETURN (
    SELECT role
    FROM business_users
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
      AND status = 'active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Check if user can perform action
CREATE OR REPLACE FUNCTION can_perform_action(
    p_business_id UUID,
    p_required_role VARCHAR
  ) RETURNS BOOLEAN AS $$
DECLARE v_user_role VARCHAR;
BEGIN v_user_role := get_user_role(p_business_id);
IF v_user_role IS NULL THEN RETURN FALSE;
END IF;
RETURN CASE
  p_required_role
  WHEN 'admin' THEN v_user_role = 'admin'
  WHEN 'editor' THEN v_user_role IN ('admin', 'editor', 'manager')
  WHEN 'viewer' THEN v_user_role IN ('admin', 'editor', 'manager', 'viewer', 'member')
  ELSE FALSE
END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ================================
-- BUSINESSES TABLE POLICIES
-- ================================
-- Users can view businesses they belong to
CREATE POLICY "businesses_select_policy" ON businesses FOR
SELECT USING (
    id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
-- Users can insert new businesses (they become admin)
CREATE POLICY "businesses_insert_policy" ON businesses FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Admins can update their business
CREATE POLICY "businesses_update_policy" ON businesses FOR
UPDATE USING (can_perform_action(id, 'admin'));
-- Admins can delete their business
CREATE POLICY "businesses_delete_policy" ON businesses FOR DELETE USING (can_perform_action(id, 'admin'));
-- ================================
-- BUSINESS_USERS TABLE POLICIES
-- ================================
-- Users can view team members in their businesses
CREATE POLICY "business_users_select_policy" ON business_users FOR
SELECT USING (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
-- Admins can add members
CREATE POLICY "business_users_insert_policy" ON business_users FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'admin')
  );
-- Admins can update members
CREATE POLICY "business_users_update_policy" ON business_users FOR
UPDATE USING (
    can_perform_action(business_id, 'admin')
  );
-- Admins can remove members
CREATE POLICY "business_users_delete_policy" ON business_users FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- INVITATIONS TABLE POLICIES
-- ================================
-- Users can view invitations sent to them or their businesses
CREATE POLICY "invitations_select_policy" ON invitations FOR
SELECT USING (
    email = (
      SELECT email
      FROM auth.users
      WHERE id = auth.uid()
    )
    OR business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
-- Admins can create invitations
CREATE POLICY "invitations_insert_policy" ON invitations FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'admin')
  );
-- Admins can update invitations
CREATE POLICY "invitations_update_policy" ON invitations FOR
UPDATE USING (
    can_perform_action(business_id, 'admin')
  );
-- Anyone can delete their accepted invitations
CREATE POLICY "invitations_delete_policy" ON invitations FOR DELETE USING (redeemed_by = auth.uid());
-- ================================
-- AUDIT_LOGS TABLE POLICIES
-- ================================
-- Users can view audit logs for their businesses
CREATE POLICY "audit_logs_select_policy" ON audit_logs FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- System can insert audit logs
CREATE POLICY "audit_logs_insert_policy" ON audit_logs FOR
INSERT WITH CHECK (TRUE);
-- ================================
-- API_KEYS TABLE POLICIES
-- ================================
-- Users can view their business's API keys
CREATE POLICY "api_keys_select_policy" ON api_keys FOR
SELECT USING (
    can_perform_action(business_id, 'admin')
  );
-- Admins can create API keys
CREATE POLICY "api_keys_insert_policy" ON api_keys FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'admin')
  );
-- Admins can delete API keys
CREATE POLICY "api_keys_delete_policy" ON api_keys FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- CONTACTS TABLE POLICIES
-- ================================
-- Users can view contacts in their businesses
CREATE POLICY "contacts_select_policy" ON contacts FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create contacts
CREATE POLICY "contacts_insert_policy" ON contacts FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update contacts
CREATE POLICY "contacts_update_policy" ON contacts FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Admins can delete contacts
CREATE POLICY "contacts_delete_policy" ON contacts FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- DEALS TABLE POLICIES
-- ================================
-- Users can view deals
CREATE POLICY "deals_select_policy" ON deals FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create deals
CREATE POLICY "deals_insert_policy" ON deals FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update deals
CREATE POLICY "deals_update_policy" ON deals FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Admins can delete deals
CREATE POLICY "deals_delete_policy" ON deals FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- INTERACTIONS TABLE POLICIES
-- ================================
-- Users can view interactions
CREATE POLICY "interactions_select_policy" ON interactions FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create interactions
CREATE POLICY "interactions_insert_policy" ON interactions FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update interactions
CREATE POLICY "interactions_update_policy" ON interactions FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- ================================
-- WEBSITES TABLE POLICIES
-- ================================
-- Users can view websites
CREATE POLICY "websites_select_policy" ON websites FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create websites
CREATE POLICY "websites_insert_policy" ON websites FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update websites
CREATE POLICY "websites_update_policy" ON websites FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Admins can delete websites
CREATE POLICY "websites_delete_policy" ON websites FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- PAGES TABLE POLICIES
-- ================================
-- Users can view pages
CREATE POLICY "pages_select_policy" ON pages FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create pages
CREATE POLICY "pages_insert_policy" ON pages FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update pages
CREATE POLICY "pages_update_policy" ON pages FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Admins can delete pages
CREATE POLICY "pages_delete_policy" ON pages FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- COMPONENTS TABLE POLICIES
-- ================================
-- Users can view components
CREATE POLICY "components_select_policy" ON components FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create components
CREATE POLICY "components_insert_policy" ON components FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update components
CREATE POLICY "components_update_policy" ON components FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Editors can delete components
CREATE POLICY "components_delete_policy" ON components FOR DELETE USING (
  can_perform_action(business_id, 'editor')
);
-- ================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ================================
-- Users can view their subscription
CREATE POLICY "subscriptions_select_policy" ON subscriptions FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Only system can insert/update/delete subscriptions
CREATE POLICY "subscriptions_insert_policy" ON subscriptions FOR
INSERT WITH CHECK (FALSE);
CREATE POLICY "subscriptions_update_policy" ON subscriptions FOR
UPDATE USING (FALSE);
-- ================================
-- TRANSACTIONS TABLE POLICIES
-- ================================
-- Users can view transactions
CREATE POLICY "transactions_select_policy" ON transactions FOR
SELECT USING (
    can_perform_action(business_id, 'admin')
  );
-- Only system can insert transactions
CREATE POLICY "transactions_insert_policy" ON transactions FOR
INSERT WITH CHECK (FALSE);
-- ================================
-- VIDEOS TABLE POLICIES
-- ================================
-- Users can view videos
CREATE POLICY "videos_select_policy" ON videos FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create videos
CREATE POLICY "videos_insert_policy" ON videos FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update videos
CREATE POLICY "videos_update_policy" ON videos FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Admins can delete videos
CREATE POLICY "videos_delete_policy" ON videos FOR DELETE USING (
  can_perform_action(business_id, 'admin')
);
-- ================================
-- VIDEO_CLIPS TABLE POLICIES
-- ================================
-- Users can view clips
CREATE POLICY "video_clips_select_policy" ON video_clips FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create clips
CREATE POLICY "video_clips_insert_policy" ON video_clips FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update clips
CREATE POLICY "video_clips_update_policy" ON video_clips FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Editors can delete clips
CREATE POLICY "video_clips_delete_policy" ON video_clips FOR DELETE USING (
  can_perform_action(business_id, 'editor')
);
-- ================================
-- EVENTS TABLE POLICIES
-- ================================
-- Everyone can insert events (public tracking)
CREATE POLICY "events_insert_policy" ON events FOR
INSERT WITH CHECK (TRUE);
-- Users can view their events
CREATE POLICY "events_select_policy" ON events FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- ================================
-- FUNNEL_STEPS TABLE POLICIES
-- ================================
-- Users can view funnel steps
CREATE POLICY "funnel_steps_select_policy" ON funnel_steps FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create funnel steps
CREATE POLICY "funnel_steps_insert_policy" ON funnel_steps FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- Editors can update funnel steps
CREATE POLICY "funnel_steps_update_policy" ON funnel_steps FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Editors can delete funnel steps
CREATE POLICY "funnel_steps_delete_policy" ON funnel_steps FOR DELETE USING (
  can_perform_action(business_id, 'editor')
);
-- ================================
-- SUPPORT_TICKETS TABLE POLICIES
-- ================================
-- Users can view tickets
CREATE POLICY "support_tickets_select_policy" ON support_tickets FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Viewers can create tickets
CREATE POLICY "support_tickets_insert_policy" ON support_tickets FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'viewer')
  );
-- Editors/Admins can update tickets
CREATE POLICY "support_tickets_update_policy" ON support_tickets FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- ================================
-- TICKET_REPLIES TABLE POLICIES
-- ================================
-- Users can view ticket replies
CREATE POLICY "ticket_replies_select_policy" ON ticket_replies FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Users can create replies
CREATE POLICY "ticket_replies_insert_policy" ON ticket_replies FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'viewer')
  );
-- ================================
-- AI_MEMORY TABLE POLICIES
-- ================================
-- Users can view AI memory
CREATE POLICY "ai_memory_select_policy" ON ai_memory FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create/update memory
CREATE POLICY "ai_memory_insert_policy" ON ai_memory FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
CREATE POLICY "ai_memory_update_policy" ON ai_memory FOR
UPDATE USING (
    can_perform_action(business_id, 'editor')
  );
-- Editors can delete memory
CREATE POLICY "ai_memory_delete_policy" ON ai_memory FOR DELETE USING (
  can_perform_action(business_id, 'editor')
);
-- ================================
-- AI_EXECUTION_LOGS TABLE POLICIES
-- ================================
-- Users can view execution logs
CREATE POLICY "ai_execution_logs_select_policy" ON ai_execution_logs FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- Editors can create logs
CREATE POLICY "ai_execution_logs_insert_policy" ON ai_execution_logs FOR
INSERT WITH CHECK (
    can_perform_action(business_id, 'editor')
  );
-- ================================
-- USAGE_METRICS TABLE POLICIES
-- ================================
-- Users can view their usage
CREATE POLICY "usage_metrics_select_policy" ON usage_metrics FOR
SELECT USING (
    can_perform_action(business_id, 'viewer')
  );
-- System can insert usage metrics
CREATE POLICY "usage_metrics_insert_policy" ON usage_metrics FOR
INSERT WITH CHECK (TRUE);