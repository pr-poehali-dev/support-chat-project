import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface RatingsViewProps {
  user: any;
}

const API_BASE = {
  ratings: 'https://functions.poehali.dev/268cfe59-99f3-40c4-bcbe-809b762215fe',
};

export default function RatingsView({ user }: RatingsViewProps) {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE.ratings}?operator_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить оценки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const avgScore = ratings.length > 0
    ? Math.round(ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length)
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Мои оценки</h1>
        <p className="text-muted-foreground">Оценки качества работы от ОКК</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Средний балл</CardDescription>
            <CardTitle className={`text-3xl ${getScoreColor(avgScore)}`}>{avgScore}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Всего оценок</CardDescription>
            <CardTitle className="text-3xl">{ratings.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Лучший результат</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {ratings.length > 0 ? Math.max(...ratings.map(r => r.score)) : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>История оценок</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-3">
              {ratings.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Icon name="Star" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Пока нет оценок</p>
                </div>
              ) : (
                ratings.map((rating) => (
                  <Card key={rating.id} className="border-primary/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{rating.client_name}</CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(rating.chat_date).toLocaleDateString('ru-RU')}
                          </CardDescription>
                        </div>
                        <Badge className={getScoreColor(rating.score)}>
                          {rating.score} баллов
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <Icon name="User" size={14} className="inline mr-1" />
                          Оценил: {rating.rater_name}
                        </div>
                        {rating.comment && (
                          <div className="p-3 rounded-lg bg-muted/30 text-sm">
                            <Icon name="MessageSquare" size={14} className="inline mr-1" />
                            {rating.comment}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
