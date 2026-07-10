import React, { useState } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/WorkspaceContext';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceDialog({ open, onClose }: CreateWorkspaceDialogProps) {
  const { createWorkspace, setCurrentWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    const workspace = await createWorkspace(name.trim(), description.trim() || undefined);
    setIsCreating(false);

    if (workspace) {
      setCurrentWorkspace(workspace);
      setName('');
      setDescription('');
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-medium text-white">Create Workspace</h2>
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
              Workspace Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Team"
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this workspace for?"
              rows={3}
              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-xs text-cyan-400">
              Workspaces let you share contacts with your team. You can invite members and control their access level.
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
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0a0c] font-bold"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Workspace'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
