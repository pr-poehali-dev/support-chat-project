import ChatsView from './views/ChatsView';
import QCPortalView from './views/QCPortalView';
import MonitoringView from './views/MonitoringView';
import StaffManagementView from './views/StaffManagementView';

interface AdminViewProps {
  user: any;
}

export default function AdminView({ user }: AdminViewProps) {
  return <StaffManagementView user={user} />;
}
