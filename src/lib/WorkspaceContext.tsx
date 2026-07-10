import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useUser } from './UserContext';
import { toast } from 'sonner';
import { ensureUUID } from './uuid';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'active';
  invited_at: string;
  joined_at?: string;
  // Joined profile data
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
}

export interface SharedContact {
  id: string;
  workspace_id: string;
  contact_id: string;
  shared_by: string;
  shared_at: string;
  // Contact data
  contact?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    company: string;
    job_title: string;
  };
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  members: WorkspaceMember[];
  sharedContacts: SharedContact[];
  isLoading: boolean;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<boolean>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  inviteMember: (email: string, role: 'editor' | 'viewer') => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: 'editor' | 'viewer') => Promise<boolean>;
  shareContact: (contactId: string) => Promise<boolean>;
  unshareContact: (sharedContactId: string) => Promise<boolean>;
  refreshWorkspaces: () => Promise<void>;
  getCurrentUserRole: () => 'owner' | 'editor' | 'viewer' | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sharedContacts, setSharedContacts] = useState<SharedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substring(2, 6);
  };

  // Fetch all workspaces for current user
  const fetchWorkspaces = useCallback(async () => {
    if (!user?.id) {
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    try {
      // Get workspaces where user is owner
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get workspaces where user is a member
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) throw memberError;

      // Combine and dedupe
      const allWorkspaces: Workspace[] = [...(ownedWorkspaces || [])];
      memberWorkspaces?.forEach((m: any) => {
        if (m.workspaces && !allWorkspaces.find(w => w.id === m.workspaces.id)) {
          allWorkspaces.push(m.workspaces);
        }
      });

      setWorkspaces(allWorkspaces);

      // Restore last selected workspace from localStorage
      const lastWorkspaceId = localStorage.getItem('currentWorkspaceId');
      if (lastWorkspaceId && !currentWorkspace) {
        const workspace = allWorkspaces.find(w => w.id === lastWorkspaceId);
        if (workspace) setCurrentWorkspace(workspace);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentWorkspace]);

  // Fetch members of current workspace
  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setMembers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      const membersWithProfiles = (data || []).map((m: any) => ({
        ...m,
        user_email: m.profiles?.email,
        user_name: m.profiles?.full_name,
        user_avatar: m.profiles?.avatar_url,
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [currentWorkspace?.id]);

  // Fetch shared contacts in current workspace
  const fetchSharedContacts = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setSharedContacts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workspace_contacts')
        .select(`
          *,
          contacts:contact_id (
            id,
            full_name,
            email,
            phone,
            company,
            job_title
          )
        `)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      const contactsWithData = (data || []).map((sc: any) => ({
        ...sc,
        contact: sc.contacts,
      }));

      setSharedContacts(contactsWithData);
    } catch (error) {
      console.error('Failed to fetch shared contacts:', error);
    }
  }, [currentWorkspace?.id]);

  // Initial load
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Fetch members and contacts when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspaceId', currentWorkspace.id);
      fetchMembers();
      fetchSharedContacts();
    } else {
      localStorage.removeItem('currentWorkspaceId');
      setMembers([]);
      setSharedContacts([]);
    }
  }, [currentWorkspace, fetchMembers, fetchSharedContacts]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        () => fetchWorkspaces()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_members' },
        () => {
          fetchWorkspaces();
          fetchMembers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_contacts' },
        () => fetchSharedContacts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchWorkspaces, fetchMembers, fetchSharedContacts]);

  // Create workspace
  const createWorkspace = async (name: string, description?: string): Promise<Workspace | null> => {
    if (!user?.id) return null;

    try {
      const workspace = {
        id: ensureUUID(crypto.randomUUID()),
        name,
        slug: generateSlug(name),
        description: description || null,
        owner_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('workspaces').insert([workspace]);

      if (error) throw error;

      // Add owner as member
      await supabase.from('workspace_members').insert([{
        id: ensureUUID(crypto.randomUUID()),
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      }]);

      toast.success('Workspace created successfully');
      await fetchWorkspaces();
      return workspace as Workspace;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace');
      return null;
    }
  };

  // Update workspace
  const updateWorkspace = async (id: string, updates: Partial<Workspace>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Workspace updated');
      await fetchWorkspaces();
      return true;
    } catch (error) {
      console.error('Failed to update workspace:', error);
      toast.error('Failed to update workspace');
      return false;
    }
  };

  // Delete workspace
  const deleteWorkspace = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(null);
      }

      toast.success('Workspace deleted');
      await fetchWorkspaces();
      return true;
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
      return false;
    }
  };

  // Invite member
  const inviteMember = async (email: string, role: 'editor' | 'viewer'): Promise<boolean> => {
    if (!currentWorkspace?.id || !user?.id) return false;

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast.error('User not found with this email');
        return false;
      }

      // Check if already a member
      const existing = members.find(m => m.user_id === userData.id);
      if (existing) {
        toast.error('User is already a member');
        return false;
      }

      const { error } = await supabase.from('workspace_members').insert([{
        id: ensureUUID(crypto.randomUUID()),
        workspace_id: currentWorkspace.id,
        user_id: userData.id,
        role,
        status: 'active', // Auto-accept for now
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      toast.success(`Invited ${email} as ${role}`);
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast.error('Failed to invite member');
      return false;
    }
  };

  // Remove member
  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
      return false;
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: 'editor' | 'viewer'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role updated');
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
      return false;
    }
  };

  // Share contact to workspace
  const shareContact = async (contactId: string): Promise<boolean> => {
    if (!currentWorkspace?.id || !user?.id) return false;

    try {
      const { error } = await supabase.from('workspace_contacts').insert([{
        id: ensureUUID(crypto.randomUUID()),
        workspace_id: currentWorkspace.id,
        contact_id: contactId,
        shared_by: user.id,
        shared_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      toast.success('Contact shared to workspace');
      await fetchSharedContacts();
      return true;
    } catch (error) {
      console.error('Failed to share contact:', error);
      toast.error('Failed to share contact');
      return false;
    }
  };

  // Unshare contact
  const unshareContact = async (sharedContactId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspace_contacts')
        .delete()
        .eq('id', sharedContactId);

      if (error) throw error;

      toast.success('Contact removed from workspace');
      await fetchSharedContacts();
      return true;
    } catch (error) {
      console.error('Failed to unshare contact:', error);
      toast.error('Failed to remove contact');
      return false;
    }
  };

  // Get current user's role in workspace
  const getCurrentUserRole = (): 'owner' | 'editor' | 'viewer' | null => {
    if (!currentWorkspace || !user?.id) return null;
    if (currentWorkspace.owner_id === user.id) return 'owner';
    const member = members.find(m => m.user_id === user.id);
    return member?.role || null;
  };

  const refreshWorkspaces = fetchWorkspaces;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        members,
        sharedContacts,
        isLoading,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        inviteMember,
        removeMember,
        updateMemberRole,
        shareContact,
        unshareContact,
        refreshWorkspaces,
        getCurrentUserRole,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
