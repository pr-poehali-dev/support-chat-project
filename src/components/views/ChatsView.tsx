import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ChatsViewProps {
  user: any;
}

const API_BASE = {
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
};

export default function ChatsView({ user }: ChatsViewProps) {
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [closedChats, setClosedChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canViewClosed = user.permissions?.chats?.closed === true;

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const activeResponse = await fetch(`${API_BASE.chats}?status=active`);
      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveChats(activeData.filter((c: any) => c.operator_id === user.id));
      }

      if (canViewClosed) {
        const closedResponse = await fetch(`${API_BASE.chats}?status=closed`);
        if (closedResponse.ok) {
          const closedData = await closedResponse.json();
          setClosedChats(closedData.filter((c: any) => c.operator_id === user.id));
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чаты',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChatDetails = async (chatId: number) => {
    try {
      const response = await fetch(`${API_BASE.chats}?id=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedChat(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить детали чата',
        variant: 'destructive',
      });
    }
  };

  const closeChat = async (chatId: number) => {
    try {
      const response = await fetch(API_BASE.chats, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chatId, status: 'closed' }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Чат закрыт',
        });
        loadChats();
        setSelectedChat(null);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось закрыть чат',
        variant: 'destructive',
      });
    }
  };

  const renderChatList = (chats: any[], status: string) => (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-2 p-4">
        {chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
            <p>Нет {status === 'active' ? 'активных' : 'закрытых'} чатов</p>
          </div>
        ) : (
          chats.map((chat) => (
            <Card
              key={chat.id}
              className="cursor-pointer hover:bg-accent/10 transition-colors border-primary/20"
              onClick={() => loadChatDetails(chat.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{chat.client_name}</CardTitle>
                    <CardDescription className="text-xs">{chat.client_phone}</CardDescription>
                  </div>
                  <Badge variant={status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {status === 'active' ? 'Активен' : 'Закрыт'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={14} />
                    <span>{chat.message_count || 0} сообщений</span>
                  </div>
                  <span>{new Date(chat.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Мои чаты</h1>
        <p className="text-muted-foreground">Управление активными и закрытыми диалогами</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="List" size={20} />
              Список чатов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">
                  <Icon name="Clock" size={16} className="mr-2" />
                  Активные ({activeChats.length})
                </TabsTrigger>
                {canViewClosed && (
                  <TabsTrigger value="closed" className="flex-1">
                    <Icon name="Archive" size={16} className="mr-2" />
                    Закрытые ({closedChats.length})
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="active">
                {renderChatList(activeChats, 'active')}
              </TabsContent>
              {canViewClosed && (
                <TabsContent value="closed">
                  {renderChatList(closedChats, 'closed')}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessageSquare" size={20} />
              Детали чата
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedChat ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-muted-foreground">
                <Icon name="MousePointerClick" size={48} className="mb-4 opacity-50" />
                <p>Выберите чат для просмотра деталей</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-primary/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Клиент:</span>
                      <span className="font-medium">{selectedChat.client_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Телефон:</span>
                      <span className="font-medium">{selectedChat.client_phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Статус:</span>
                      <Badge variant={selectedChat.status === 'active' ? 'default' : 'secondary'}>
                        {selectedChat.status === 'active' ? 'Активен' : 'Закрыт'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-3">
                    {selectedChat.messages?.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.sender_type === 'client'
                              ? 'bg-muted/50 text-foreground border border-primary/10'
                              : 'bg-gradient-to-r from-accent to-secondary text-white'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">{msg.sender_name}</p>
                          <p className="text-sm leading-relaxed">{msg.message_text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedChat.status === 'active' && (
                  <Button
                    onClick={() => closeChat(selectedChat.id)}
                    variant="outline"
                    className="w-full"
                  >
                    <Icon name="CheckCircle" size={18} className="mr-2" />
                    Закрыть чат
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
