import { LogOut, LayoutDashboard, User } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface UserDropdownProps {
  email: string;
  hasAdminAccess: boolean;
  onDashboard: () => void;
  onLogout: () => void;
  onProfile: () => void;
}

export function UserDropdown({ email, hasAdminAccess, onDashboard, onLogout, onProfile }: UserDropdownProps) {
  return (
    <div className="dropdown-enter absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <UserAvatar email={email} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Masuk sebagai</p>
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {/* Profil Saya — semua user yang login */}
        <button
          onClick={onProfile}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          <User className="h-4 w-4" />
          Profil Saya
        </button>

        {/* Dashboard — hanya admin */}
        {hasAdminAccess && (
          <button
            onClick={onDashboard}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
        )}

        <div className="my-1 border-t border-border" />

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );
}
