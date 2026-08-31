-- =====================================================
-- Migration: Grant permissions for workspace tables and functions
-- =====================================================

-- Grant SELECT permissions on workspace tables to authenticated users
GRANT SELECT ON public.workspaces TO authenticated;
GRANT SELECT ON public.workspace_members TO authenticated;
GRANT SELECT ON public.workspace_contacts TO authenticated;

-- Grant INSERT/UPDATE/DELETE permissions
GRANT INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workspace_contacts TO authenticated;

-- Grant EXECUTE permissions on the helper functions
GRANT EXECUTE ON FUNCTION is_workspace_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_workspace_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_workspace_owner_or_editor(UUID, UUID) TO authenticated;

-- Grant permissions for connections table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;

-- =====================================================
-- Done!
-- =====================================================
