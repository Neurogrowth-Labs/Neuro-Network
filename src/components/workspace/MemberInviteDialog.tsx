import React, { useState } from 'react';
import { X, UserPlus, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspace } from '@/lib/WorkspaceContext';

interface MemberInviteDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MemberInviteDialog({ open, onClose }: MemberInviteDialogProps) {
  const { inviteMember, currentWorkspace } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;

    setIsInviting(true);
    const success = await inviteMember(email.trim(), role);
    setIsInviting(false);

    if (success) {
      setEmail('');
      setRole('viewer');
      onClose();
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('viewer');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-medium text-white">Invite Member</h2>
              <p className="text-[10px] text-white/40">{currentWorkspace?.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Role
            </label>
            <Select value={role} onValueChange={(v) => setRole(v as 'editor' | 'viewer')}>
              <SelectTrigger className="w-full bg-[#0a0a0c] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12121a] border-white/10">
                <SelectItem value="viewer">
                  <div className="flex flex-col items-start">
                    <span className="text-white">Viewer</span>
                    <span className="text-[10px] text-white/40">Can view shared contacts</span>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex flex-col items-start">
                    <span className="text-white">Editor</span>
                    <span className="text-[10px] text-white/40">Can view and share contacts</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40">
              The user must have an existing account. They will be added to the workspace immediately.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-white/60"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email.trim() || isInviting}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-bold"
          >
            {isInviting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              'Send Invite'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
