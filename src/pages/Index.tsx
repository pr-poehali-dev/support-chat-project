import { useState } from 'react';
import ClientView from '@/components/ClientView';
import StaffView from '@/components/StaffView';
import AdminView from '@/components/AdminView';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

type UserRole = 'client' | 'operator' | 'okk' | 'superadmin' | null;

interface User {
  id?: number;
  name: string;
  phone?: string;
  role: UserRole;
  permissions?: any;
  status?: string;
}

export default function Index() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setUserRole(user.role);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
  };

  if (!userRole || !currentUser) {
    return <ClientView onLogin={handleLogin} />;
  }

  if (userRole === 'client') {
    return <ClientView onLogin={handleLogin} user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-[#0F0F1E] via-[#1A1F2C] to-[#0F0F1E]">
        <AppSidebar user={currentUser} onLogout={handleLogout} />
        <main className="flex-1">
          {userRole === 'superadmin' && <AdminView user={currentUser} />}
          {(userRole === 'operator' || userRole === 'okk') && <StaffView user={currentUser} />}
        </main>
      </div>
    </SidebarProvider>
  );
}
