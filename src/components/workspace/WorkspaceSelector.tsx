import React, { useState } from 'react';
import { ChevronDown, Users, Plus, Check } from 'lucide-react';
import { useWorkspace } from '@/lib/WorkspaceContext';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';

export default function WorkspaceSelector() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, isLoading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/80 max-w-[100px] truncate">
            {currentWorkspace?.name || 'Personal'}
          </span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#12121a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
              {/* Personal option */}
              <button
                onClick={() => {
                  setCurrentWorkspace(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                  !currentWorkspace ? 'bg-cyan-500/10' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-white">Personal</p>
                  <p className="text-[10px] text-white/40">Your private contacts</p>
                </div>
                {!currentWorkspace && (
                  <Check className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              {/* Divider */}
              {workspaces.length > 0 && (
                <div className="border-t border-white/5 my-1" />
              )}

              {/* Workspaces */}
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    setCurrentWorkspace(workspace);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                    currentWorkspace?.id === workspace.id ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-400">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white truncate">{workspace.name}</p>
                    <p className="text-[10px] text-white/40">Team workspace</p>
                  </div>
                  {currentWorkspace?.id === workspace.id && (
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Create new */}
              <div className="border-t border-white/5 mt-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-cyan-400"
                >
                  <div className="w-8 h-8 rounded-full border border-dashed border-cyan-500/50 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Create Workspace</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
