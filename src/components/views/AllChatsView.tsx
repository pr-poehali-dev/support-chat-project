import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Chat {
  id: number;
  client_name: string;
  client_phone: string;
  operator_id: number | null;
  operator_name: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  timer_expires_at: string | null;
  resolution: string | null;
  scheduled_for: string | null;
  message_count: number;
  qc_status?: string | null;
}

interface Message {
  id: number;
  chat_id: number;
  sender_type: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface AllChatsViewProps {
  user: any;
}

const API_BASE = {
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  messages: 'https://functions.poehali.dev/8a82e18f-0755-4f89-b831-b1825fa9299a',
};

const statusConfig: Record<string, { label: string; variant: any; color: string }> = {
  active: { label: 'Активный', variant: 'default', color: 'bg-green-500' },
  closed: { label: 'Закрыт', variant: 'secondary', color: 'bg-gray-500' },
  qc: { label: 'На проверке QC', variant: 'outline', color: 'bg-yellow-500' },
  processing_qc: { label: 'Обработка QC', variant: 'outline', color: 'bg-blue-500' },
};

export default function AllChatsView({ user }: AllChatsViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previousUnassignedCount, setPreviousUnassignedCount] = useState(0);
  
  const { toast } = useToast();

  const fetchAllChats = async () => {
    setLoading(true);
    try {
      const statuses = ['active', 'closed', 'qc'];
      const allChatsPromises = statuses.map(status =>
        fetch(`${API_BASE.chats}?status=${status}`, {
          headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
      );
      
      const results = await Promise.all(allChatsPromises);
      const allChats = results.flat();
      
      allChats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const unassignedCount = allChats.filter(c => c.status === 'active' && !c.operator_id).length;
      
      if (previousUnassignedCount > 0 && unassignedCount > previousUnassignedCount) {
        const newUnassigned = unassignedCount - previousUnassignedCount;
        toast({
          title: '🆕 Неназначенные чаты',
          description: `${newUnassigned} новых чатов ждут назначения`,
          duration: 7000,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Новые неназначенные чаты', {
            body: `${newUnassigned} чатов ждут назначения оператора`,
            icon: '/favicon.ico',
          });
        }
      }
      
      setPreviousUnassignedCount(unassignedCount);
      setChats(allChats);
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

  const fetchMessages = async (chatId: number) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE.messages}?chat_id=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchAllChats();
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const interval = setInterval(fetchAllChats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      chat.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.client_phone.includes(searchQuery) ||
      chat.operator_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageSquare" size={24} />
            Все чаты
          </CardTitle>
          <CardDescription>
            Полный список всех чатов системы (активные, закрытые, на проверке)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, телефону, оператору..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Все
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Активные
              </Button>
              <Button
                variant={statusFilter === 'closed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('closed')}
              >
                Закрытые
              </Button>
              <Button
                variant={statusFilter === 'qc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('qc')}
              >
                QC
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Чаты не найдены</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleChatClick(chat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{chat.client_name}</span>
                            <Badge variant={statusConfig[chat.status]?.variant || 'secondary'}>
                              {statusConfig[chat.status]?.label || chat.status}
                            </Badge>
                            {chat.qc_status && (
                              <Badge variant="outline" className="text-xs">
                                {chat.qc_status}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Icon name="Phone" size={14} />
                              <span>{chat.client_phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icon name="User" size={14} />
                              <span>{chat.operator_name || 'Не назначен'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icon name="MessageCircle" size={14} />
                              <span>{chat.message_count} сообщений</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-1">
                          <div>
                            <div className="font-medium text-foreground mb-1">Создан:</div>
                            {formatDate(chat.created_at)}
                          </div>
                          {chat.closed_at && (
                            <div className="mt-2">
                              <div className="font-medium text-foreground mb-1">Закрыт:</div>
                              {formatDate(chat.closed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Детали чата #{selectedChat?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedChat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Клиент</div>
                  <div className="font-medium">{selectedChat.client_name}</div>
                  <div className="text-sm text-muted-foreground">{selectedChat.client_phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Оператор</div>
                  <div className="font-medium">{selectedChat.operator_name || 'Не назначен'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Статус</div>
                  <Badge variant={statusConfig[selectedChat.status]?.variant}>
                    {statusConfig[selectedChat.status]?.label}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Создан</div>
                  <div className="text-sm">{formatDate(selectedChat.created_at)}</div>
                </div>
                {selectedChat.closed_at && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Закрыт</div>
                    <div className="text-sm">{formatDate(selectedChat.closed_at)}</div>
                  </div>
                )}
                {selectedChat.resolution && (
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">Результат</div>
                    <Badge variant="outline">{selectedChat.resolution}</Badge>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-2">История сообщений</div>
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Icon name="Loader2" size={24} className="animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Сообщений нет
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 ${
                              msg.sender_type === 'client'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="text-xs font-medium mb-1 opacity-70">
                              {msg.sender_name}
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatDate(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}