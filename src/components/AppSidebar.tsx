import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  user: any;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const API_BASE = {
  staff: 'https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9',
};

const statusConfig = {
  online: { label: 'На линии', color: 'bg-green-500', icon: 'Radio' },
  jira: { label: 'Обработка Jira', color: 'bg-blue-500', icon: 'FileText' },
  break: { label: 'Отдых', color: 'bg-yellow-500', icon: 'Coffee' },
  offline: { label: 'Не в сети', color: 'bg-gray-500', icon: 'CircleOff' },
};

export function AppSidebar({ user, onLogout, currentView, onViewChange }: AppSidebarProps) {
  const [currentStatus, setCurrentStatus] = useState(user.status || 'offline');

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(API_BASE.staff, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, status: newStatus }),
      });
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const isOperator = user.role === 'operator';
  const isOKK = user.role === 'okk';
  const isSuperAdmin = user.role === 'superadmin';

  return (
    <Sidebar className="border-r border-primary/20 bg-card/50 backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Icon name={isSuperAdmin ? 'Crown' : 'Shield'} size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">{user.name}</h2>
            <p className="text-xs text-muted-foreground">
              {user.role === 'operator' && 'Оператор КЦ'}
              {user.role === 'okk' && 'ОКК'}
              {user.role === 'superadmin' && 'Супер Админ'}
            </p>
          </div>
        </div>

        {(isOperator || isOKK) && (
          <div className="mt-4">
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig[currentStatus as keyof typeof statusConfig].color}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isOperator || isOKK) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('chats')} isActive={currentView === 'chats'}>
                      <Icon name="MessageSquare" size={18} />
                      <span>Мои чаты</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('ratings')} isActive={currentView === 'ratings'}>
                      <Icon name="Star" size={18} />
                      <span>Мои оценки</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('results')} isActive={currentView === 'results'}>
                      <Icon name="BarChart3" size={18} />
                      <span>Результаты</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {(isOKK || isSuperAdmin) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('clients')} isActive={currentView === 'clients'}>
                      <Icon name="Users" size={18} />
                      <span>Клиенты</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('qc')} isActive={currentView === 'qc'}>
                      <Icon name="ClipboardCheck" size={18} />
                      <span>Портал QC</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('monitoring')} isActive={currentView === 'monitoring'}>
                      <Icon name="Monitor" size={18} />
                      <span>Мониторинг</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onViewChange('analytics')} isActive={currentView === 'analytics'}>
                      <Icon name="TrendingUp" size={18} />
                      <span>Аналитика</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {isSuperAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => onViewChange('staff')} isActive={currentView === 'staff'}>
                    <Icon name="Users" size={18} />
                    <span>Сотрудники</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-primary/20">
        <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start text-muted-foreground hover:text-destructive">
          <Icon name="LogOut" size={18} className="mr-2" />
          Выход
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}