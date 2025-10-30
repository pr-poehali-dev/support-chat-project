import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ChatList from './chats/ChatList';
import MessageList from './chats/MessageList';
import ChatTimer from './chats/ChatTimer';
import CloseDialog from './chats/CloseDialog';

interface ChatsViewProps {
  user: any;
}

const API_BASE = {
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  messages: 'https://functions.poehali.dev/22e68c6c-71ba-4fba-9a45-d0bb76d2dc1d',
  staff: 'https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9',
};

export default function ChatsView({ user }: ChatsViewProps) {
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [closedChats, setClosedChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const { toast } = useToast();

  const canViewClosed = user.permissions?.chats?.closed === true;

  useEffect(() => {
    loadChats();
    loadOperators();
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      const interval = setInterval(() => loadMessages(selectedChat.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const loadOperators = async () => {
    try {
      const response = await fetch(API_BASE.staff);
      if (response.ok) {
        const data = await response.json();
        setOperators(data.filter((s: any) => s.role === 'operator' || s.role === 'okk'));
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
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

  const handleChatUpdate = (updatedChat: any) => {
    setSelectedChat(updatedChat);
  };

  const handleChatTransfer = () => {
    setSelectedChat(null);
    loadChats();
  };

  const handleCloseSuccess = () => {
    setSelectedChat(null);
    loadChats();
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    setMessages([]);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Мои чаты</h1>
        <p className="text-muted-foreground">Управление активными и закрытыми чатами</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Список чатов</CardTitle>
            <CardDescription>
              Активные: {activeChats.length}
              {canViewClosed && ` • Закрытые: ${closedChats.length}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Активные ({activeChats.length})
                </TabsTrigger>
                {canViewClosed && (
                  <TabsTrigger value="closed">
                    Закрытые ({closedChats.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="active" className="mt-4">
                <ChatList
                  chats={activeChats}
                  selectedChatId={selectedChat?.id || null}
                  onSelectChat={handleSelectChat}
                />
              </TabsContent>

              {canViewClosed && (
                <TabsContent value="closed" className="mt-4">
                  <ChatList
                    chats={closedChats}
                    selectedChatId={selectedChat?.id || null}
                    onSelectChat={handleSelectChat}
                    showStatus
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          {selectedChat ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="User" size={20} />
                      {selectedChat.client_name || 'Клиент'}
                    </CardTitle>
                    <CardDescription>
                      ID чата: {selectedChat.id} • Создан: {new Date(selectedChat.created_at).toLocaleString('ru-RU')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedChat.status === 'active' && (
                      <>
                        <ChatTimer
                          chat={selectedChat}
                          apiBase={API_BASE.chats}
                          onChatUpdate={handleChatUpdate}
                          onChatTransfer={handleChatTransfer}
                        />
                        <Button onClick={() => setShowCloseDialog(true)} variant="outline">
                          <Icon name="CheckCircle" size={16} className="mr-2" />
                          Закрыть
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <MessageList
                  messages={messages}
                  userId={user.id}
                  newMessage={newMessage}
                  onNewMessageChange={setNewMessage}
                  onSendMessage={sendMessage}
                  loading={loading}
                />
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
              <Icon name="MessageSquare" size={64} className="mb-4 opacity-50" />
              <p className="text-lg">Выберите чат для начала</p>
            </div>
          )}
        </Card>
      </div>

      {selectedChat && (
        <CloseDialog
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          chatId={selectedChat.id}
          apiBase={API_BASE.chats}
          operators={operators}
          onSuccess={handleCloseSuccess}
        />
      )}
    </div>
  );
}
