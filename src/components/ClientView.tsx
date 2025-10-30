import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'client' | 'operator';
  text: string;
  timestamp: Date;
}

interface ClientViewProps {
  onLogin: (user: any) => void;
  user?: any;
  onLogout?: () => void;
}

const API_BASE = {
  auth: 'https://functions.poehali.dev/03630bc0-7132-48cf-9d16-3c48f59e5ba7',
  chats: 'https://functions.poehali.dev/b0aca3f2-d278-440e-afd7-2408aa9f7fdd',
  messages: 'https://functions.poehali.dev/8a82e18f-0755-4f89-b831-b1825fa9299a',
};

export default function ClientView({ onLogin, user, onLogout }: ClientViewProps) {
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [staffLogin, setStaffLogin] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatId, setChatId] = useState<number | null>(null);

  const { toast } = useToast();

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const sessionId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      console.log('Creating chat with data:', {
        client_name: clientName,
        client_phone: clientPhone,
        session_id: sessionId,
      });
      
      const response = await fetch(API_BASE.chats, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_phone: clientPhone,
          session_id: sessionId,
          message: `Здравствуйте! Меня зовут ${clientName}`,
        }),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setChatId(data.id);
        
        setMessages([
          {
            id: '1',
            sender: 'operator',
            text: `Здравствуйте, ${clientName}! Я оператор поддержки. Чем могу помочь?`,
            timestamp: new Date(),
          },
        ]);

        onLogin({ name: clientName, phone: clientPhone, role: 'client', sessionId });
        
        toast({
          title: 'Добро пожаловать!',
          description: 'Вы подключены к оператору',
        });
      } else {
        let errorMessage = 'Не удалось создать чат';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        
        console.error('Chat creation failed:', errorMessage);
        toast({
          title: 'Ошибка',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: 'Ошибка',
        description: `Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        variant: 'destructive',
      });
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: staffLogin,
          password: staffPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data);
        setShowStaffLogin(false);
        
        toast({
          title: 'Вход выполнен',
          description: `Добро пожаловать, ${data.name}!`,
        });
      } else {
        toast({
          title: 'Ошибка входа',
          description: 'Неверный логин или пароль',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти в систему',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !chatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'client',
      text: messageInput,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    try {
      await fetch(API_BASE.messages, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          sender_type: 'client',
          sender_name: user?.name || 'Клиент',
          message_text: messageInput,
        }),
      });

      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'operator',
          text: 'Спасибо за ваше сообщение! Оператор обрабатывает ваш запрос.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (user && user.role === 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] via-[#1A1F2C] to-[#0F0F1E]">
        <div className="container mx-auto max-w-5xl h-screen flex flex-col p-4">
          <div className="flex items-center justify-between py-4 border-b border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Icon name="Headphones" size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{user.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Клиент</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
              <Icon name="LogOut" size={18} className="mr-2" />
              Выход
            </Button>
          </div>

          <Card className="flex-1 flex flex-col mt-4 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-primary/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Чат поддержки</CardTitle>
                  <CardDescription>Оператор онлайн</CardDescription>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-sm text-primary">Онлайн</span>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender === 'client'
                          ? 'bg-gradient-to-r from-primary to-accent text-white'
                          : 'bg-muted/50 text-foreground border border-primary/10'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'client' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <CardContent className="border-t border-primary/20 pt-4 pb-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Введите сообщение..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-background/50"
                />
                <Button type="submit" size="icon" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-10 w-10">
                  <Icon name="Send" size={18} />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showStaffLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0F0F1E] via-[#1A1F2C] to-[#0F0F1E]">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-accent/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  <Icon name="Shield" size={20} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Вход сотрудников</CardTitle>
                  <CardDescription>Используйте служебные данные</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login">Логин</Label>
                  <Input
                    id="login"
                    placeholder="Введите логин"
                    value={staffLogin}
                    onChange={(e) => setStaffLogin(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Введите пароль"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStaffLogin(false)}
                    className="w-full"
                  >
                    Назад
                  </Button>
                  <Button type="submit" className="w-full bg-gradient-to-r from-accent to-secondary hover:opacity-90">
                    <Icon name="LogIn" size={18} className="mr-2" />
                    Войти
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0F0F1E] via-[#1A1F2C] to-[#0F0F1E]">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
            <Icon name="Headphones" size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Поддержка
          </h1>
          <p className="text-muted-foreground">Мы на связи 24/7</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Начать чат</CardTitle>
            <CardDescription>Заполните форму для связи с оператором</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ваше имя</Label>
                <Input
                  id="name"
                  placeholder="Иван Иванов"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  placeholder="+7 (999) 123-45-67"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                <Icon name="MessageCircle" size={18} className="mr-2" />
                Начать чат
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStaffLogin(true)}
            className="text-muted-foreground hover:text-primary"
          >
            <Icon name="Shield" size={16} className="mr-2" />
            Вход для сотрудников
          </Button>
        </div>
      </div>
    </div>
  );
}