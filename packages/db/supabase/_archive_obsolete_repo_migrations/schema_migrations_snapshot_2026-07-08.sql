-- Snapshot of supabase_migrations.schema_migrations (version, name) taken
-- 2026-07-08, immediately BEFORE reconciling migration history to the
-- squashed baseline 20260101000000_remote_baseline (RECONCILIATION.md Path A).
--
-- To roll the reconciliation back (tracking only — schema is unaffected):
--   DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260101000000';
--   then run the INSERTs below.

INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
('20260423221531', 'create_team_members_table'),
('20260423221641', 'fix_businesses_rls_policy'),
('20260423221648', 'add_business_creation_trigger'),
('20260423221735', 'fix_businesses_type_column'),
('20260423221747', 'comprehensive_businesses_table_fix'),
('20260423221911', 'add_unique_constraints_businesses'),
('20260423221921', 'enhance_business_trigger_with_slug'),
('20260423222023', 'fix_slug_constraint_issue'),
('20260423222113', 'fix_businesses_constraint'),
('20260423222128', 'cleanup_businesses_rls'),
('20260424060407', 'fix_all_constraint_issues'),
('20260424060417', 'finalize_businesses_setup'),
('20260424060650', 'comprehensive_on_conflict_fix'),
('20260424060658', 'simplify_rls_for_insert'),
('20260424060852', 'final_comprehensive_fix'),
('20260424060921', 'consolidate_triggers'),
('20260424060935', 'cleanup_rls_policies'),
('20260424194727', 'fix_all_core_issues'),
('20260424195006', 'fix_onboarding_flow_and_profile_sync'),
('20260425100349', 'fix_all_rls_policies'),
('20260515030038', 'ogmj_crm_engine'),
('20260515030055', 'ogmj_funnel_website_engine'),
('20260515030114', 'ogmj_automation_engine'),
('20260515030558', '001_marketplace_payments_referrals'),
('20260515030628', '002_ai_content_forms_leads'),
('20260515030658', '003_api_keys_webhooks_invitations_admin'),
('20260515030721', '004_performance_indexes'),
('20260515030755', '005_rls_policies_complete'),
('20260515030840', '006_functions_triggers_automation'),
('20260515030918', '007_rls_existing_tables_hardening'),
('20260515072446', 'add_workspaces_leads_appointments_sequences'),
('20260515072520', 'add_products_messaging_rbac_infrastructure'),
('20260515072548', 'add_performance_indexes_new_tables'),
('20260515072632', 'add_rls_policies_new_tables'),
('20260515072754', 'add_functions_triggers_rpcs_v2'),
('20260515074152', 'phase1_missing_audit_business_users'),
('20260515074203', 'phase1_missing_interactions_components'),
('20260515074223', 'phase1_missing_subscription_plans_transactions'),
('20260515074238', 'phase1_missing_video_clips_events_analytics'),
('20260515074252', 'phase1_missing_ai_memory_execution_logs'),
('20260515074305', 'phase1_missing_rate_limits_usage_metrics'),
('20260515074324', 'phase1_enhance_existing_tables_missing_columns'),
('20260515074351', 'phase1_helper_functions_rpcs'),
('20260515074420', 'phase1_rls_policies_new_tables'),
('20260515074434', 'phase1_performance_indexes_final');
