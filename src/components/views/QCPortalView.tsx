import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface QCPortalViewProps {
  user: any;
}

const API_BASE = {
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  ratings: 'https://functions.poehali.dev/268cfe59-99f3-40c4-bcbe-809b762215fe',
};

export default function QCPortalView({ user }: QCPortalViewProps) {
  const [closedChats, setClosedChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [score, setScore] = useState([50]);
  const [comment, setComment] = useState('');
  const [existingRating, setExistingRating] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClosedChats();
  }, []);

  const loadClosedChats = async () => {
    try {
      const response = await fetch(`${API_BASE.chats}?status=closed`);
      if (response.ok) {
        const data = await response.json();
        setClosedChats(data.filter((c: any) => c.operator_id !== null));
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чаты',
        variant: 'destructive',
      });
    }
  };

  const loadChatDetails = async (chatId: number) => {
    try {
      const [chatRes, ratingRes] = await Promise.all([
        fetch(`${API_BASE.chats}?id=${chatId}`),
        fetch(`${API_BASE.ratings}?chat_id=${chatId}`)
      ]);

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setSelectedChat(chatData);
      }

      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        if (ratingData) {
          setExistingRating(ratingData);
          setScore([ratingData.score]);
          setComment(ratingData.comment || '');
        } else {
          setExistingRating(null);
          setScore([50]);
          setComment('');
        }
      }
    } catch (error) {
      console.error('Failed to load chat details:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(API_BASE.ratings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedChat.id,
          operator_id: selectedChat.operator_id,
          rated_by: user.id,
          score: score[0],
          comment,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Оценка сохранена',
        });
        loadChatDetails(selectedChat.id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить оценку',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Портал QC</h1>
        <p className="text-muted-foreground">Контроль качества обслуживания клиентов</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Закрытые чаты операторов</CardTitle>
            <CardDescription>{closedChats.length} чатов доступно для оценки</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {closedChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className="cursor-pointer hover:bg-accent/10 transition-colors border-primary/20"
                    onClick={() => loadChatDetails(chat.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{chat.client_name}</CardTitle>
                          <CardDescription className="text-xs">
                            Оператор: {chat.operator_name}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{chat.message_count || 0} сообщений</span>
                        <span>{new Date(chat.closed_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Оценка чата</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedChat ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-muted-foreground">
                <Icon name="ClipboardCheck" size={48} className="mb-4 opacity-50" />
                <p>Выберите чат для оценки</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/30 border border-primary/10">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Клиент:</span>
                      <span className="font-medium">{selectedChat.client_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Оператор:</span>
                      <span className="font-medium">{selectedChat.operator_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Дата закрытия:</span>
                      <span className="font-medium">
                        {new Date(selectedChat.closed_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[250px] border border-primary/10 rounded-lg p-4">
                  <div className="space-y-3">
                    {selectedChat.messages?.map((msg: any) => (
                      <div key={msg.id} className="text-sm">
                        <p className="font-medium text-xs text-muted-foreground">{msg.sender_name}</p>
                        <p className="mt-1">{msg.message_text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Оценка (0-100)</Label>
                      <span className={`text-2xl font-bold ${getScoreColor(score[0])}`}>
                        {score[0]}
                      </span>
                    </div>
                    <Slider
                      value={score}
                      onValueChange={setScore}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Плохо (0)</span>
                      <span>Отлично (100)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Комментарий для оператора</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Опишите сильные и слабые стороны..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleSubmitRating} className="w-full">
                    <Icon name="Save" size={18} className="mr-2" />
                    {existingRating ? 'Обновить оценку' : 'Сохранить оценку'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
