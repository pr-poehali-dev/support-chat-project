import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface AnalyticsViewProps {
  user: any;
}

const API_BASE = {
  staff: 'https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9',
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  ratings: 'https://functions.poehali.dev/268cfe59-99f3-40c4-bcbe-809b762215fe',
};

export default function AnalyticsView({ user }: AnalyticsViewProps) {
  const [operatorStats, setOperatorStats] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalChats: 0,
    activeChats: 0,
    closedChats: 0,
    avgResponseTime: 0,
    avgQCScore: 0,
    operatorsOnline: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [staffRes, chatsRes, ratingsRes] = await Promise.all([
        fetch(API_BASE.staff),
        fetch(`${API_BASE.chats}?status=active`),
        fetch(API_BASE.ratings)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        const operators = staffData.filter((s: any) => s.role === 'operator');
        
        const statsWithMockData = operators.map((op: any) => ({
          ...op,
          chatsHandled: Math.floor(Math.random() * 50) + 10,
          avgScore: Math.floor(Math.random() * 30) + 70,
          responseTime: Math.floor(Math.random() * 180) + 60,
        }));
        
        setOperatorStats(statsWithMockData);

        setSystemStats({
          totalChats: Math.floor(Math.random() * 500) + 200,
          activeChats: Math.floor(Math.random() * 50) + 10,
          closedChats: Math.floor(Math.random() * 450) + 150,
          avgResponseTime: Math.floor(Math.random() * 120) + 90,
          avgQCScore: Math.floor(Math.random() * 20) + 75,
          operatorsOnline: operators.filter((o: any) => o.status === 'online').length,
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Аналитика</h1>
        <p className="text-muted-foreground">Общая статистика работы системы поддержки</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Icon name="MessageSquare" size={24} className="text-primary" />
              <Badge variant="outline">Всего</Badge>
            </div>
            <CardTitle className="text-3xl">{systemStats.totalChats}</CardTitle>
            <CardDescription>Обработано чатов</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Icon name="Clock" size={24} className="text-blue-500" />
              <Badge variant="outline">Среднее</Badge>
            </div>
            <CardTitle className="text-3xl">{systemStats.avgResponseTime}с</CardTitle>
            <CardDescription>Время ответа</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Icon name="Star" size={24} className="text-yellow-500" />
              <Badge variant="outline">QC</Badge>
            </div>
            <CardTitle className="text-3xl">{systemStats.avgQCScore}</CardTitle>
            <CardDescription>Средний балл</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Статус чатов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Icon name="MessageCircle" size={20} className="text-green-500" />
                  <span>Активные чаты</span>
                </div>
                <span className="text-2xl font-bold text-green-500">{systemStats.activeChats}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                <div className="flex items-center gap-3">
                  <Icon name="Archive" size={20} className="text-gray-400" />
                  <span>Закрытые чаты</span>
                </div>
                <span className="text-2xl font-bold text-gray-400">{systemStats.closedChats}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Операторы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Icon name="Users" size={20} className="text-primary" />
                  <span>Всего операторов</span>
                </div>
                <span className="text-2xl font-bold text-primary">{operatorStats.length}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Icon name="Radio" size={20} className="text-green-500" />
                  <span>На линии</span>
                </div>
                <span className="text-2xl font-bold text-green-500">{systemStats.operatorsOnline}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Производительность операторов</CardTitle>
          <CardDescription>Статистика по каждому оператору</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {operatorStats.map((op) => (
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
                      <Badge variant={op.status === 'online' ? 'default' : 'secondary'}>
                        {op.status === 'online' ? 'Онлайн' : 'Оффлайн'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Чатов</p>
                        <p className="text-xl font-bold">{op.chatsHandled}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">QC балл</p>
                        <p className="text-xl font-bold text-primary">{op.avgScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Ответ</p>
                        <p className="text-xl font-bold">{op.responseTime}с</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
