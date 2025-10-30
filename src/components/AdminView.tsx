import QCPortalView from './views/QCPortalView';
import MonitoringView from './views/MonitoringView';
import StaffManagementView from './views/StaffManagementView';
import AnalyticsView from './views/AnalyticsView';
import ClientsView from './views/ClientsView';

interface AdminViewProps {
  user: any;
  currentView: string;
}

export default function AdminView({ user, currentView }: AdminViewProps) {
  return (
    <>
      {currentView === 'staff' && <StaffManagementView user={user} />}
      {currentView === 'clients' && <ClientsView user={user} />}
      {currentView === 'qc' && <QCPortalView user={user} />}
      {currentView === 'monitoring' && <MonitoringView user={user} />}
      {currentView === 'analytics' && <AnalyticsView user={user} />}
    </>
  );
}