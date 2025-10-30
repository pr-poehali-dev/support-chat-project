import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface MonitoringViewProps {
  user: any;
}

const API_BASE = {
  staff: 'https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9',
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  ratings: 'https://functions.poehali.dev/268cfe59-99f3-40c4-bcbe-809b762215fe',
};

const statusConfig = {
  online: { label: 'На линии', color: 'bg-green-500', icon: 'Radio' },
  jira: { label: 'Обработка Jira', color: 'bg-blue-500', icon: 'FileText' },
  break: { label: 'Отдых', color: 'bg-yellow-500', icon: 'Coffee' },
  offline: { label: 'Не в сети', color: 'bg-gray-500', icon: 'CircleOff' },
};

export default function MonitoringView({ user }: MonitoringViewProps) {
  const [operators, setOperators] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, closed: 0, avgScore: 0 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [staffRes, chatsRes, ratingsRes] = await Promise.all([
        fetch(API_BASE.staff),
        fetch(`${API_BASE.chats}?status=active`),
        fetch(API_BASE.ratings)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setOperators(staffData.filter((s: any) => s.role === 'operator'));
      }

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setStats(prev => ({ ...prev, active: chatsData.length }));
      }

      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        const avg = ratingsData.length > 0
          ? Math.round(ratingsData.reduce((sum: number, r: any) => sum + r.score, 0) / ratingsData.length)
          : 0;
        setStats(prev => ({ ...prev, avgScore: avg }));
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  };

  const statusCount = operators.reduce((acc, op) => {
    acc[op.status] = (acc[op.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Мониторинг</h1>
        <p className="text-muted-foreground">Текущее состояние операторов и системы</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(statusConfig).map(([key, config]) => (
          <Card key={key} className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <Icon name={config.icon as any} size={20} className="text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">{statusCount[key] || 0}</CardTitle>
              <CardDescription>{config.label}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardDescription>Активных чатов</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardDescription>Средний QC балл</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.avgScore}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardDescription>Всего операторов</CardDescription>
            <CardTitle className="text-3xl">{operators.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Операторы онлайн</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-500px)]">
            <div className="space-y-2">
              {operators.map((op) => (
                <Card key={op.id} className="border-primary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Icon name="User" size={18} className="text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{op.name}</CardTitle>
                          <CardDescription className="text-xs">@{op.login}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusConfig[op.status as keyof typeof statusConfig].color}`} />
                        <span className="text-sm text-muted-foreground">
                          {statusConfig[op.status as keyof typeof statusConfig].label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
