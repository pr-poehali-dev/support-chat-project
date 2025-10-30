import { useState, useEffect } from 'react';
import ClientView from '@/components/ClientView';
import StaffView from '@/components/StaffView';
import AdminView from '@/components/AdminView';

type UserRole = 'client' | 'operator' | 'okk' | 'superadmin' | null;

interface User {
  id?: number;
  name: string;
  phone?: string;
  role: UserRole;
  permissions?: any;
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

  if (userRole === 'superadmin') {
    return <AdminView user={currentUser} onLogout={handleLogout} />;
  }

  if (userRole === 'operator' || userRole === 'okk') {
    return <StaffView user={currentUser} onLogout={handleLogout} />;
  }

  if (userRole === 'client') {
    return <ClientView onLogin={handleLogin} user={currentUser} onLogout={handleLogout} />;
  }

  return null;
}
