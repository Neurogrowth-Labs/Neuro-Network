-- =====================================================
-- Migration: Fix infinite recursion in workspace_members RLS policies
-- =====================================================

-- Create a SECURITY DEFINER function to check workspace membership
-- This avoids the infinite recursion by bypassing RLS
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = uid
    AND status = 'active'
  );
$$;

-- Create a function to check workspace ownership
CREATE OR REPLACE FUNCTION is_workspace_owner(ws_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = ws_id
    AND owner_id = uid
  );
$$;

-- Create a function to check if user is owner or editor
CREATE OR REPLACE FUNCTION is_workspace_owner_or_editor(ws_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces WHERE id = ws_id AND owner_id = uid
  ) OR EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = uid
    AND role IN ('owner', 'editor')
    AND status = 'active'
  );
$$;

-- =====================================================
-- Fix workspace_members policies
-- =====================================================

DROP POLICY IF EXISTS "Members can view workspace membership" ON workspace_members;
CREATE POLICY "Members can view workspace membership"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_workspace_member(workspace_id, auth.uid()) OR
    is_workspace_owner(workspace_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners and editors can add members" ON workspace_members;
CREATE POLICY "Owners and editors can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    is_workspace_owner_or_editor(workspace_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners and editors can update members" ON workspace_members;
CREATE POLICY "Owners and editors can update members"
  ON workspace_members FOR UPDATE
  USING (
    is_workspace_owner_or_editor(workspace_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners can remove members" ON workspace_members;
CREATE POLICY "Owners can remove members"
  ON workspace_members FOR DELETE
  USING (
    is_workspace_owner(workspace_id, auth.uid()) OR
    user_id = auth.uid()
  );

-- =====================================================
-- Fix workspace_contacts policies (also uses workspace_members)
-- =====================================================

DROP POLICY IF EXISTS "Members can view shared contacts" ON workspace_contacts;
CREATE POLICY "Members can view shared contacts"
  ON workspace_contacts FOR SELECT
  USING (
    is_workspace_member(workspace_id, auth.uid()) OR
    is_workspace_owner(workspace_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners and editors can share contacts" ON workspace_contacts;
CREATE POLICY "Owners and editors can share contacts"
  ON workspace_contacts FOR INSERT
  WITH CHECK (
    is_workspace_owner_or_editor(workspace_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owners and editors can unshare contacts" ON workspace_contacts;
CREATE POLICY "Owners and editors can unshare contacts"
  ON workspace_contacts FOR DELETE
  USING (
    is_workspace_owner_or_editor(workspace_id, auth.uid())
  );

-- =====================================================
-- Done!
-- =====================================================
