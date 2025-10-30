import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'client' | 'operator' | 'okk' | 'superadmin' | null;

interface Message {
  id: string;
  sender: 'client' | 'operator';
  text: string;
  timestamp: Date;
}

interface User {
  name: string;
  phone?: string;
  role: UserRole;
}

export default function Index() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  const [staffLogin, setStaffLogin] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const { toast } = useToast();

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentUser({ name: clientName, phone: clientPhone, role: 'client' });
    setUserRole('client');
    
    setMessages([
      {
        id: '1',
        sender: 'operator',
        text: `Здравствуйте, ${clientName}! Я оператор поддержки. Чем могу помочь?`,
        timestamp: new Date(),
      },
    ]);
    
    toast({
      title: 'Добро пожаловать!',
      description: 'Вы подключены к оператору',
    });
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    let role: UserRole = null;
    let name = '';

    if (staffLogin === '123' && staffPassword === '803254') {
      role = 'superadmin';
      name = 'Супер Админ';
    } else if (staffLogin === 'operator' && staffPassword === 'op123') {
      role = 'operator';
      name = 'Оператор КЦ';
    } else if (staffLogin === 'okk' && staffPassword === 'okk123') {
      role = 'okk';
      name = 'ОКК';
    } else {
      toast({
        title: 'Ошибка входа',
        description: 'Неверный логин или пароль',
        variant: 'destructive',
      });
      return;
    }

    setCurrentUser({ name, role });
    setUserRole(role);
    setShowStaffLogin(false);
    
    toast({
      title: `Вход выполнен`,
      description: `Добро пожаловать, ${name}!`,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: userRole === 'client' ? 'client' : 'operator',
      text: messageInput,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    if (userRole === 'client') {
      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'operator',
          text: 'Спасибо за ваше сообщение! Оператор обрабатывает ваш запрос.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1000);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setMessages([]);
    setClientName('');
    setClientPhone('');
    setStaffLogin('');
    setStaffPassword('');
  };

  if (userRole === null && !showStaffLogin) {
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

  if (showStaffLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0F0F1E] via-[#1A1F2C] to-[#0F0F1E]">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-accent/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                    <Icon name="Shield" size={20} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Вход сотрудников</CardTitle>
                    <CardDescription>Используйте служебные данные</CardDescription>
                  </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] via-[#1A1F2C] to-[#0F0F1E]">
      <div className="container mx-auto max-w-5xl h-screen flex flex-col p-4">
        <div className="flex items-center justify-between py-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Icon name="Headphones" size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{currentUser?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>
                  {userRole === 'client' && 'Клиент'}
                  {userRole === 'operator' && 'Оператор КЦ поток'}
                  {userRole === 'okk' && 'ОКК'}
                  {userRole === 'superadmin' && 'Супер Админ'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <Icon name="LogOut" size={18} className="mr-2" />
            Выход
          </Button>
        </div>

        <Card className="flex-1 flex flex-col mt-4 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-primary/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Чат поддержки</CardTitle>
                <CardDescription>
                  {userRole === 'client' ? 'Оператор онлайн' : 'Активный диалог'}
                </CardDescription>
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
