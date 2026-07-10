import React from 'react';
import { Users, Mail, Phone, Building2, Trash2, UserMinus } from 'lucide-react';
import { useWorkspace } from '@/lib/WorkspaceContext';

export default function SharedContactsList() {
  const { sharedContacts, unshareContact, getCurrentUserRole } = useWorkspace();

  const currentUserRole = getCurrentUserRole();
  const canUnshare = currentUserRole === 'owner' || currentUserRole === 'editor';

  const handleUnshare = async (sharedContactId: string) => {
    if (confirm('Remove this contact from the workspace?')) {
      await unshareContact(sharedContactId);
    }
  };

  if (sharedContacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
        <h3 className="text-sm font-medium text-white/60 mb-2">No shared contacts</h3>
        <p className="text-xs text-white/40 max-w-xs mx-auto">
          Share contacts from your vault to make them visible to all workspace members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Shared Contacts</h3>
          <p className="text-[10px] text-white/40">
            {sharedContacts.length} contact{sharedContacts.length !== 1 ? 's' : ''} shared in this workspace
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sharedContacts.map((sc) => {
          const contact = sc.contact;
          if (!contact) return null;

          return (
            <div
              key={sc.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white/60">
                  {(contact.full_name || '?').charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {contact.full_name || 'Unknown'}
                </p>
                {contact.job_title && (
                  <p className="text-xs text-white/60 truncate">
                    {contact.job_title}
                    {contact.company && ` at ${contact.company}`}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2">
                  {contact.email && (
                    <div className="flex items-center gap-1 text-[10px] text-white/40">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1 text-[10px] text-white/40">
                      <Phone className="w-3 h-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {canUnshare && (
                <button
                  onClick={() => handleUnshare(sc.id)}
                  className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove from workspace"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
