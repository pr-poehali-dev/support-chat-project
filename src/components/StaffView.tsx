import ChatsView from './views/ChatsView';
import RatingsView from './views/RatingsView';
import QCPortalView from './views/QCPortalView';
import MonitoringView from './views/MonitoringView';

interface StaffViewProps {
  user: any;
}

export default function StaffView({ user }: StaffViewProps) {
  return <ChatsView user={user} />;
}
