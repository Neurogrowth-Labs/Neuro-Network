import React, { useState } from "react";
import { Users, UserPlus, Share2, Settings, Plus, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/WorkspaceContext";
import CreateWorkspaceDialog from "@/components/workspace/CreateWorkspaceDialog";
import MemberListPanel from "@/components/workspace/MemberListPanel";
import SharedContactsList from "@/components/workspace/SharedContactsList";

type TabType = 'members' | 'contacts' | 'settings';

export default function Team() {
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    deleteWorkspace,
    updateWorkspace,
    getCurrentUserRole,
    isLoading,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const currentUserRole = getCurrentUserRole();
  const isOwner = currentUserRole === 'owner';

  const handleStartEdit = () => {
    if (currentWorkspace) {
      setEditName(currentWorkspace.name);
      setEditDescription(currentWorkspace.description || '');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (currentWorkspace && editName.trim()) {
      await updateWorkspace(currentWorkspace.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (currentWorkspace && confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      await deleteWorkspace(currentWorkspace.id);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'contacts', label: 'Shared Contacts', icon: Share2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // No workspace selected
  if (!currentWorkspace) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-light tracking-tighter text-white mb-2">
              Team Workspace
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Collaborate with your team
            </p>
          </div>
        </div>

        {/* Workspace selection */}
        <div className="space-y-4">
          {workspaces.length > 0 ? (
            <>
              <p className="text-sm text-white/60">Select a workspace to manage:</p>
              <div className="grid gap-3">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => setCurrentWorkspace(workspace)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-cyan-400">
                        {workspace.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{workspace.name}</p>
                      <p className="text-xs text-white/40">
                        {workspace.description || 'No description'}
                      </p>
                    </div>
                    <Users className="w-5 h-5 text-white/20" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No workspaces yet</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
                Create a workspace to start collaborating with your team and sharing contacts.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workspace
              </Button>
            </div>
          )}

          {workspaces.length > 0 && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="w-full border-dashed border-white/10 text-white/60 hover:text-white hover:border-cyan-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Workspace
            </Button>
          )}
        </div>

        <CreateWorkspaceDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      </div>
    );
  }

  // Workspace selected
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-cyan-400">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tighter text-white">
                {currentWorkspace.name}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {currentUserRole} • Team Workspace
              </p>
            </div>
          </div>
          {currentWorkspace.description && (
            <p className="text-sm text-white/60 mt-2">{currentWorkspace.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setCurrentWorkspace(null)}
          className="text-white/40 hover:text-white"
        >
          Switch Workspace
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          // Hide settings tab for non-owners
          if (tab.id === 'settings' && !isOwner) return null;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'members' && <MemberListPanel />}

        {activeTab === 'contacts' && <SharedContactsList />}

        {activeTab === 'settings' && isOwner && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white">Workspace Settings</h3>

              {isEditing ? (
                <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEdit}
                      size="sm"
                      className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c]"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      size="sm"
                      className="text-white/60"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm text-white">{currentWorkspace.name}</p>
                    <p className="text-xs text-white/40">
                      {currentWorkspace.description || 'No description'}
                    </p>
                  </div>
                  <Button
                    onClick={handleStartEdit}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-white/5">
              <h3 className="text-sm font-medium text-red-400 mb-4">Danger Zone</h3>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Delete Workspace</p>
                    <p className="text-xs text-white/40">
                      This will permanently delete the workspace and remove all members.
                    </p>
                  </div>
                  <Button
                    onClick={handleDeleteWorkspace}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
