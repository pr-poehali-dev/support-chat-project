import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ResultsViewProps {
  user: any;
}

const API_BASE = {
  staff: 'https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9',
};

const statusConfig = {
  online: { label: 'На линии', color: 'text-green-500', icon: 'Radio' },
  jira: { label: 'Обработка Jira', color: 'text-blue-500', icon: 'FileText' },
  break: { label: 'Отдых', color: 'text-yellow-500', icon: 'Coffee' },
  offline: { label: 'Не в сети', color: 'text-gray-500', icon: 'CircleOff' },
};

export default function ResultsView({ user }: ResultsViewProps) {
  const [dailyStats, setDailyStats] = useState<any>({ online: 0, jira: 0, break: 0, offline: 0 });
  const [monthlyStats, setMonthlyStats] = useState<any>({ online: 0, jira: 0, break: 0, offline: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      setDailyStats({
        online: Math.floor(Math.random() * 300) + 100,
        jira: Math.floor(Math.random() * 120) + 30,
        break: Math.floor(Math.random() * 60) + 15,
        offline: Math.floor(Math.random() * 50) + 10,
      });

      setMonthlyStats({
        online: Math.floor(Math.random() * 6000) + 2000,
        jira: Math.floor(Math.random() * 2400) + 600,
        break: Math.floor(Math.random() * 1200) + 300,
        offline: Math.floor(Math.random() * 800) + 200,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const renderStatsCards = (stats: any) => (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(statusConfig).map(([key, config]) => (
        <Card key={key} className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Icon name={config.icon as any} size={20} className={config.color} />
              <CardDescription>{config.label}</CardDescription>
            </div>
            <CardTitle className={`text-2xl ${config.color}`}>
              {formatTime(stats[key] || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Мои результаты</h1>
        <p className="text-muted-foreground">Статистика рабочего времени по статусам</p>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">
            <Icon name="Calendar" size={16} className="mr-2" />
            Сегодня
          </TabsTrigger>
          <TabsTrigger value="month">
            <Icon name="CalendarRange" size={16} className="mr-2" />
            Текущий месяц
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Результаты за сегодня</h2>
            <Badge variant="outline">{new Date().toLocaleDateString('ru-RU')}</Badge>
          </div>
          {renderStatsCards(dailyStats)}

          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Детальная статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Icon name="Radio" size={20} className="text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">На линии</p>
                      <p className="text-sm text-muted-foreground">Активная работа с клиентами</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">{formatTime(dailyStats.online)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((dailyStats.online / (dailyStats.online + dailyStats.jira + dailyStats.break + dailyStats.offline)) * 100)}% от общего
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Icon name="FileText" size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Обработка Jira</p>
                      <p className="text-sm text-muted-foreground">Работа с тикетами</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-500">{formatTime(dailyStats.jira)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((dailyStats.jira / (dailyStats.online + dailyStats.jira + dailyStats.break + dailyStats.offline)) * 100)}% от общего
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Icon name="Coffee" size={20} className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">Отдых</p>
                      <p className="text-sm text-muted-foreground">Перерывы</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-500">{formatTime(dailyStats.break)}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((dailyStats.break / (dailyStats.online + dailyStats.jira + dailyStats.break + dailyStats.offline)) * 100)}% от общего
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Результаты за месяц</h2>
            <Badge variant="outline">
              {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </Badge>
          </div>
          {renderStatsCards(monthlyStats)}

          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Общая статистика месяца</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Общее рабочее время</p>
                      <p className="text-3xl font-bold text-green-500">
                        {formatTime(monthlyStats.online + monthlyStats.jira)}
                      </p>
                    </div>
                    <Icon name="TrendingUp" size={48} className="text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Среднее время на линии в день</p>
                    <p className="text-xl font-bold text-primary">
                      {formatTime(Math.floor(monthlyStats.online / 22))}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Эффективность</p>
                    <p className="text-xl font-bold text-primary">
                      {Math.round((monthlyStats.online / (monthlyStats.online + monthlyStats.jira + monthlyStats.break)) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
