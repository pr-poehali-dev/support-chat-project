import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ChatsViewProps {
  user: any;
}

const API_BASE = {
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  messages: 'https://functions.poehali.dev/22e68c6c-71ba-4fba-9a45-d0bb76d2dc1d',
};

const CHAT_TIMEOUT = 15 * 60 * 1000;
const WARNING_TIME = 2 * 60 * 1000;

export default function ChatsView({ user }: ChatsViewProps) {
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [closedChats, setClosedChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeResolution, setCloseResolution] = useState<'resolved' | 'postponed' | 'escalated'>('resolved');
  const [closeComment, setCloseComment] = useState('');
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeTime, setPostponeTime] = useState('');
  const [escalateToOperator, setEscalateToOperator] = useState('');
  const [operators, setOperators] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const canViewClosed = user.permissions?.chats?.closed === true;

  useEffect(() => {
    loadChats();
    loadOperators();
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOperators = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9');
      if (response.ok) {
        const data = await response.json();
        setOperators(data.filter((s: any) => s.role === 'operator' || s.role === 'okk'));
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      startChatTimer(selectedChat);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChatTimer = (chat: any) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const startTime = chat.timer_expires_at ? new Date(chat.timer_expires_at).getTime() - CHAT_TIMEOUT : Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = CHAT_TIMEOUT - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setShowTimeoutDialog(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        setTimeRemaining(remaining);
        
        if (remaining <= WARNING_TIME && remaining > WARNING_TIME - 1000) {
          toast({
            title: 'Внимание!',
            description: `Осталось ${Math.ceil(remaining / 60000)} минут для обработки чата`,
            variant: 'destructive',
          });
        }
      }
    }, 1000);
  };

  const extendChatTime = async () => {
    if (!selectedChat) return;
    
    try {
      const response = await fetch(API_BASE.chats, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedChat.id,
          extend_timer: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Время обработки продлено на 15 минут',
        });
        setShowTimeoutDialog(false);
        const updatedChat = await response.json();
        setSelectedChat(updatedChat);
        startChatTimer(updatedChat);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось продлить время',
        variant: 'destructive',
      });
    }
  };

  const transferChat = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(API_BASE.chats, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedChat.id,
          transfer_to_next: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Чат передан другому оператору',
        });
        setShowTimeoutDialog(false);
        setSelectedChat(null);
        loadChats();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось передать чат',
        variant: 'destructive',
      });
    }
  };

  const loadChats = async () => {
    try {
      const activeResponse = await fetch(`${API_BASE.chats}?status=active&operator_id=${user.id}`);
      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveChats(activeData);
      }

      if (canViewClosed) {
        const closedResponse = await fetch(`${API_BASE.chats}?status=closed&operator_id=${user.id}`);
        if (closedResponse.ok) {
          const closedData = await closedResponse.json();
          setClosedChats(closedData);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
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
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await fetch(API_BASE.messages, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedChat.id,
          sender_type: 'operator',
          sender_id: user.id,
          sender_name: user.name,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(selectedChat.id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    }
  };

  const handleCloseChat = () => {
    if (!closeComment.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Комментарий обязателен',
        variant: 'destructive',
      });
      return;
    }

    if (closeResolution === 'postponed' && (!postponeDate || !postponeTime)) {
      toast({
        title: 'Ошибка',
        description: 'Укажите дату и время',
        variant: 'destructive',
      });
      return;
    }

    if (closeResolution === 'escalated' && !escalateToOperator) {
      toast({
        title: 'Ошибка',
        description: 'Выберите оператора для эскалации',
        variant: 'destructive',
      });
      return;
    }

    closeChat();
  };

  const closeChat = async () => {
    if (!selectedChat) return;

    try {
      let response;

      if (closeResolution === 'escalated') {
        response = await fetch(API_BASE.chats, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedChat.id,
            resolution: 'escalated',
            resolution_comment: closeComment,
            escalate_to_operator_id: parseInt(escalateToOperator),
          }),
        });
      } else {
        const scheduledFor = closeResolution === 'postponed' 
          ? new Date(`${postponeDate}T${postponeTime}`).toISOString()
          : null;

        response = await fetch(API_BASE.chats, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedChat.id,
            status: 'closed',
            resolution: closeResolution,
            resolution_comment: closeComment,
            scheduled_for: scheduledFor,
          }),
        });
      }

      if (response.ok) {
        let description = 'Чат закрыт';
        if (closeResolution === 'postponed') description = 'Чат отложен';
        if (closeResolution === 'escalated') description = 'Чат эскалирован';
        
        toast({
          title: 'Успешно',
          description,
        });
        setShowCloseDialog(false);
        setCloseComment('');
        setPostponeDate('');
        setPostponeTime('');
        setEscalateToOperator('');
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

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!timeRemaining) return 'text-gray-500';
    if (timeRemaining <= WARNING_TIME) return 'text-red-500';
    if (timeRemaining <= 5 * 60000) return 'text-yellow-500';
    return 'text-green-500';
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
              className={`cursor-pointer hover:bg-accent/10 transition-colors border-primary/20 ${
                selectedChat?.id === chat.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedChat(chat)}
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon name="MessageSquare" size={20} />
                Чат
              </CardTitle>
              {selectedChat && timeRemaining !== null && (
                <div className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimerColor()}`}>
                  <Icon name="Timer" size={20} />
                  {formatTimeRemaining(timeRemaining)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedChat ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-muted-foreground">
                <Icon name="MousePointerClick" size={48} className="mb-4 opacity-50" />
                <p>Выберите чат для начала работы</p>
              </div>
            ) : (
              <div className="flex flex-col h-[calc(100vh-300px)]">
                <div className="p-4 rounded-lg bg-muted/30 border border-primary/10 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{selectedChat.client_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedChat.client_phone}</p>
                    </div>
                    {selectedChat.status === 'active' && (
                      <Button onClick={() => setShowCloseDialog(true)} variant="outline" size="sm">
                        <Icon name="CheckCircle" size={16} className="mr-2" />
                        Закрыть чат
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 mb-4 p-4 rounded-lg bg-muted/10">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender_type === 'client'
                              ? 'bg-muted text-foreground'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {msg.sender_type !== 'client' && (
                            <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {selectedChat.status === 'active' && (
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Введите сообщение..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Icon name="Send" size={20} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Закрыть чат</DialogTitle>
            <DialogDescription>Выберите резолюцию и добавьте комментарий</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Резолюция</Label>
              <div className="flex gap-2">
                <Button
                  variant={closeResolution === 'resolved' ? 'default' : 'outline'}
                  onClick={() => setCloseResolution('resolved')}
                  className="flex-1"
                >
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  Решено
                </Button>
                <Button
                  variant={closeResolution === 'postponed' ? 'default' : 'outline'}
                  onClick={() => setCloseResolution('postponed')}
                  className="flex-1"
                >
                  <Icon name="Clock" size={16} className="mr-2" />
                  Отложить
                </Button>
                <Button
                  variant={closeResolution === 'escalated' ? 'default' : 'outline'}
                  onClick={() => setCloseResolution('escalated')}
                  className="flex-1"
                >
                  <Icon name="ArrowUp" size={16} className="mr-2" />
                  Эскалировать
                </Button>
              </div>
            </div>

            {closeResolution === 'postponed' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Дата</Label>
                  <Input
                    type="date"
                    value={postponeDate}
                    onChange={(e) => setPostponeDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Время</Label>
                  <Input
                    type="time"
                    value={postponeTime}
                    onChange={(e) => setPostponeTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {closeResolution === 'escalated' && (
              <div className="space-y-2">
                <Label>Оператор для эскалации *</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md bg-background"
                  value={escalateToOperator}
                  onChange={(e) => setEscalateToOperator(e.target.value)}
                >
                  <option value="">Выберите оператора...</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.role === 'okk' ? 'ОКК' : 'Оператор'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Комментарий *</Label>
              <Textarea
                value={closeComment}
                onChange={(e) => setCloseComment(e.target.value)}
                placeholder="Опишите результат обработки..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCloseDialog(false);
              setEscalateToOperator('');
            }}>
              Отмена
            </Button>
            <Button onClick={handleCloseChat}>
              Закрыть чат
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTimeoutDialog} onOpenChange={setShowTimeoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Время истекло</DialogTitle>
            <DialogDescription>
              Время обработки чата истекло. Выберите действие.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-2">
            <Button onClick={extendChatTime} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Продлить на 15 минут
            </Button>
            <Button onClick={transferChat} variant="outline" className="w-full">
              <Icon name="UserSwitch" size={16} className="mr-2" />
              Передать другому оператору
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}