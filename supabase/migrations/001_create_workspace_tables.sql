-- =====================================================
-- Migration: Create Workspace Tables for Team Feature
-- =====================================================

-- 1. Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Workspace members (join table with roles)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')) NOT NULL DEFAULT 'viewer',
  status TEXT CHECK (status IN ('pending', 'active', 'declined')) NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(workspace_id, user_id)
);

-- 3. Shared contacts in workspace
CREATE TABLE IF NOT EXISTS workspace_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, contact_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON workspace_members(status);
CREATE INDEX IF NOT EXISTS idx_workspace_contacts_workspace ON workspace_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_contacts_contact ON workspace_contacts(contact_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_contacts ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
DROP POLICY IF EXISTS "Users can view workspaces they own or are members of" ON workspaces;
CREATE POLICY "Users can view workspaces they own or are members of"
  ON workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Only owners can update workspaces" ON workspaces;
CREATE POLICY "Only owners can update workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owners can delete workspaces" ON workspaces;
CREATE POLICY "Only owners can delete workspaces"
  ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Workspace members policies
DROP POLICY IF EXISTS "Members can view workspace membership" ON workspace_members;
CREATE POLICY "Members can view workspace membership"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and editors can add members" ON workspace_members;
CREATE POLICY "Owners and editors can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
      AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners and editors can update members" ON workspace_members;
CREATE POLICY "Owners and editors can update members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
      AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners can remove members" ON workspace_members;
CREATE POLICY "Owners can remove members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id = auth.uid()
    ) OR
    -- Users can remove themselves
    user_id = auth.uid()
  );

-- Workspace contacts policies
DROP POLICY IF EXISTS "Members can view shared contacts" ON workspace_contacts;
CREATE POLICY "Members can view shared contacts"
  ON workspace_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_contacts.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_contacts.workspace_id
      AND w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and editors can share contacts" ON workspace_contacts;
CREATE POLICY "Owners and editors can share contacts"
  ON workspace_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_contacts.workspace_id
      AND w.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_contacts.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
      AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners and editors can unshare contacts" ON workspace_contacts;
CREATE POLICY "Owners and editors can unshare contacts"
  ON workspace_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_contacts.workspace_id
      AND w.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_contacts.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'editor')
      AND wm.status = 'active'
    )
  );

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Analytics tables for Dashboard stats
-- =====================================================

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  saved_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template TEXT DEFAULT 'executive',
  theme_color TEXT DEFAULT '#06b6d4',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_card_saves_owner ON card_saves(card_owner_id);
CREATE INDEX IF NOT EXISTS idx_card_saves_saved_at ON card_saves(saved_at);
CREATE INDEX IF NOT EXISTS idx_business_cards_user ON business_cards(user_id);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile views" ON profile_views;
CREATE POLICY "Users can view their own profile views"
  ON profile_views FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_views;
CREATE POLICY "Anyone can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their card saves" ON card_saves;
CREATE POLICY "Users can view their card saves"
  ON card_saves FOR SELECT
  USING (card_owner_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert card saves" ON card_saves;
CREATE POLICY "Anyone can insert card saves"
  ON card_saves FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage their own business cards" ON business_cards;
CREATE POLICY "Users can manage their own business cards"
  ON business_cards FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- Done!
-- =====================================================
