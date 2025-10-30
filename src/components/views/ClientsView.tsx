import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ClientsViewProps {
  user: any;
}

const API_BASE = {
  clients: 'https://functions.poehali.dev/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  messages: 'https://functions.poehali.dev/22e68c6c-71ba-4fba-9a45-d0bb76d2dc1d',
};

export default function ClientsView({ user }: ClientsViewProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientChats, setClientChats] = useState<any[]>([]);
  const [selectedChatMessages, setSelectedChatMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientChats(selectedClient.id);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE.clients);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить клиентов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientChats = async (clientId: string) => {
    try {
      const response = await fetch(`${API_BASE.chats}?client_id=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClientChats(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чаты клиента',
        variant: 'destructive',
      });
    }
  };

  const loadChatMessages = async (chatId: number) => {
    try {
      const response = await fetch(`${API_BASE.messages}?chat_id=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedChatMessages(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    }
  };

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.session_id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Клиенты</h1>
        <p className="text-muted-foreground">База всех клиентов обратившихся в поддержку</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Users" size={20} />
              Список клиентов ({filteredClients.length})
            </CardTitle>
            <div className="pt-2">
              <Input
                placeholder="Поиск по имени, email, телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {filteredClients.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Icon name="UserX" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Клиенты не найдены</p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <Card
                      key={client.id}
                      className={`cursor-pointer hover:bg-accent/10 transition-colors border-primary/10 ${
                        selectedClient?.id === client.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                              <Icon name="User" size={18} className="text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">
                                {client.name || 'Гость'}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {client.phone || client.email || client.session_id?.slice(0, 8)}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {client.total_chats || 0} чатов
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Icon name="Clock" size={12} />
                            <span>Первый контакт</span>
                          </div>
                          <span>{new Date(client.first_contact_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessageSquare" size={20} />
              История чатов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedClient ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-muted-foreground">
                <Icon name="MousePointerClick" size={48} className="mb-4 opacity-50" />
                <p>Выберите клиента</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted/30 border border-primary/10 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Имя:</span>
                        <span className="font-medium">{selectedClient.name || 'Не указано'}</span>
                      </div>
                      {selectedClient.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedClient.email}</span>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Телефон:</span>
                          <span className="font-medium">{selectedClient.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Всего чатов:</span>
                        <Badge>{selectedClient.total_chats || 0}</Badge>
                      </div>
                    </div>
                  </div>

                  {clientChats.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Нет чатов</p>
                    </div>
                  ) : (
                    clientChats.map((chat) => (
                      <Card
                        key={chat.id}
                        className="cursor-pointer hover:bg-accent/10 transition-colors border-primary/10"
                        onClick={() => loadChatMessages(chat.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm">Чат #{chat.id}</CardTitle>
                              <CardDescription className="text-xs">
                                {new Date(chat.created_at).toLocaleString('ru-RU')}
                              </CardDescription>
                            </div>
                            <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>
                              {chat.status === 'active' ? 'Активен' : 'Закрыт'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            {chat.resolution && (
                              <div className="flex items-center gap-2 text-xs">
                                <Icon 
                                  name={chat.resolution === 'resolved' ? 'CheckCircle' : 'Clock'} 
                                  size={12} 
                                />
                                <span>{chat.resolution === 'resolved' ? 'Решено' : 'Отложено'}</span>
                              </div>
                            )}
                            {chat.handling_time && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Icon name="Timer" size={12} />
                                <span>Время обработки: {chat.handling_time} мин</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessagesSquare" size={20} />
              Диалог
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedChatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-muted-foreground">
                <Icon name="MessageCircle" size={48} className="mb-4 opacity-50" />
                <p>Выберите чат для просмотра</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3 p-4">
                  {selectedChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'client' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender_type === 'client'
                            ? 'bg-muted text-foreground'
                            : msg.sender_type === 'system'
                            ? 'bg-yellow-500/10 text-foreground border border-yellow-500/20'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {msg.sender_type !== 'client' && msg.sender_name && (
                          <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>
                        )}
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
