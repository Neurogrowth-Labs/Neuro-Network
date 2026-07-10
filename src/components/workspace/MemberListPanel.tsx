import React, { useState } from 'react';
import { UserPlus, MoreVertical, Shield, Eye, Edit3, Trash2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspace, type WorkspaceMember } from '@/lib/WorkspaceContext';
import { useUser } from '@/lib/UserContext';
import MemberInviteDialog from './MemberInviteDialog';

export default function MemberListPanel() {
  const { members, removeMember, updateMemberRole, getCurrentUserRole, currentWorkspace } = useWorkspace();
  const { user } = useUser();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const currentUserRole = getCurrentUserRole();
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'editor';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px]">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px]">
            <Edit3 className="w-3 h-3" />
            Editor
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px]">
            <Eye className="w-3 h-3" />
            Viewer
          </span>
        );
      default:
        return null;
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'editor' | 'viewer') => {
    await updateMemberRole(memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(memberId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Team Members</h3>
          <p className="text-[10px] text-white/40">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canManageMembers && (
          <Button
            onClick={() => setShowInviteDialog(true)}
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-bold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const isCurrentUser = member.user_id === user?.id;
          const isOwner = member.role === 'owner';
          const canModify = canManageMembers && !isOwner && !isCurrentUser;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                {member.user_avatar ? (
                  <img
                    src={member.user_avatar}
                    alt={member.user_name || ''}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-white/60">
                    {(member.user_name || member.user_email || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white truncate">
                    {member.user_name || 'Unknown'}
                    {isCurrentUser && (
                      <span className="text-white/40 ml-1">(you)</span>
                    )}
                  </p>
                  {getRoleBadge(member.role)}
                </div>
                <p className="text-[10px] text-white/40 truncate">
                  {member.user_email}
                </p>
              </div>

              {/* Actions */}
              {canModify && (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.id, v as 'editor' | 'viewer')}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs bg-transparent border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12121a] border-white/10">
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="text-center py-8 text-white/40 text-sm">
            No members yet. Invite your team to get started.
          </div>
        )}
      </div>

      <MemberInviteDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </div>
  );
}
