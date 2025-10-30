import ChatsView from './views/ChatsView';
import RatingsView from './views/RatingsView';
import QCPortalView from './views/QCPortalView';
import MonitoringView from './views/MonitoringView';
import ResultsView from './views/ResultsView';
import AnalyticsView from './views/AnalyticsView';
import ClientsView from './views/ClientsView';

interface StaffViewProps {
  user: any;
  currentView: string;
}

export default function StaffView({ user, currentView }: StaffViewProps) {
  return (
    <>
      {currentView === 'chats' && <ChatsView user={user} />}
      {currentView === 'ratings' && <RatingsView user={user} />}
      {currentView === 'results' && <ResultsView user={user} />}
      {currentView === 'clients' && user.role === 'okk' && <ClientsView user={user} />}
      {currentView === 'qc' && user.role === 'okk' && <QCPortalView user={user} />}
      {currentView === 'monitoring' && user.role === 'okk' && <MonitoringView user={user} />}
      {currentView === 'analytics' && user.role === 'okk' && <AnalyticsView user={user} />}
    </>
  );
}