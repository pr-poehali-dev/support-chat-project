import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface StaffManagementViewProps {
  user: any;
}

const API_BASE = {
  staff: 'https://functions.poehali.dev/bee310d7-a2aa-48c6-a10d-51c31ec1fba9',
};

export default function StaffManagementView({ user }: StaffManagementViewProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    name: '',
    role: 'operator',
    permissions: {
      chats: { active: true, closed: false },
      staff: { manage: false },
      settings: { full: false },
    },
  });

  const { toast } = useToast();

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await fetch(API_BASE.staff);
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список сотрудников',
        variant: 'destructive',
      });
    }
  };

  const handleCreateStaff = async () => {
    if (!formData.login || !formData.password || !formData.name) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_BASE.staff, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Сотрудник создан',
        });
        setIsDialogOpen(false);
        loadStaff();
        setFormData({
          login: '',
          password: '',
          name: '',
          role: 'operator',
          permissions: {
            chats: { active: true, closed: false },
            staff: { manage: false },
            settings: { full: false },
          },
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать сотрудника',
        variant: 'destructive',
      });
    }
  };

  const getRoleName = (role: string) => {
    const roles: any = {
      operator: 'Оператор КЦ поток',
      okk: 'ОКК',
      superadmin: 'Супер Админ',
    };
    return roles[role] || role;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление сотрудниками</h1>
          <p className="text-muted-foreground">Создание, редактирование и управление доступами</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Icon name="UserPlus" size={18} className="mr-2" />
              Добавить сотрудника
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новый сотрудник</DialogTitle>
              <DialogDescription>Заполните данные для создания нового сотрудника</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Логин</Label>
                  <Input
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="user123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Имя</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>

              <div className="space-y-2">
                <Label>Роль</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Оператор КЦ поток</SelectItem>
                    <SelectItem value="okk">ОКК</SelectItem>
                    <SelectItem value="superadmin">Супер Админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                <Label className="text-base">Права доступа</Label>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Активные чаты</Label>
                    <p className="text-xs text-muted-foreground">Просмотр активных диалогов</p>
                  </div>
                  <Switch
                    checked={formData.permissions.chats.active}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          chats: { ...formData.permissions.chats, active: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Закрытые чаты</Label>
                    <p className="text-xs text-muted-foreground">Доступ к архиву диалогов</p>
                  </div>
                  <Switch
                    checked={formData.permissions.chats.closed}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          chats: { ...formData.permissions.chats, closed: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Управление сотрудниками</Label>
                    <p className="text-xs text-muted-foreground">Создание и редактирование</p>
                  </div>
                  <Switch
                    checked={formData.permissions.staff.manage}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          staff: { manage: checked },
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Полные настройки</Label>
                    <p className="text-xs text-muted-foreground">Доступ ко всем разделам</p>
                  </div>
                  <Switch
                    checked={formData.permissions.settings.full}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          settings: { full: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleCreateStaff} className="w-full">
                Создать сотрудника
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Список сотрудников</CardTitle>
            <CardDescription>{staff.length} сотрудников в системе</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-2">
                {staff.map((member) => (
                  <Card
                    key={member.id}
                    className="cursor-pointer hover:bg-accent/10 transition-colors border-primary/20"
                    onClick={() => setSelectedStaff(member)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          <CardDescription className="text-xs">@{member.login}</CardDescription>
                        </div>
                        <Badge variant="outline">{getRoleName(member.role)}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Детали сотрудника</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStaff ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-350px)] text-muted-foreground">
                <Icon name="UserCircle" size={48} className="mb-4 opacity-50" />
                <p>Выберите сотрудника для просмотра</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-primary/10">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">Логин</Label>
                        <p className="font-medium">{selectedStaff.login}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Имя</Label>
                        <p className="font-medium">{selectedStaff.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Роль</Label>
                        <Badge variant="outline" className="mt-1">{getRoleName(selectedStaff.role)}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">Права доступа</Label>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">Активные чаты</p>
                          <p className="text-xs text-muted-foreground">Просмотр активных диалогов</p>
                        </div>
                        <Badge variant={selectedStaff.permissions?.chats?.active ? 'default' : 'secondary'}>
                          {selectedStaff.permissions?.chats?.active ? 'Да' : 'Нет'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">Закрытые чаты</p>
                          <p className="text-xs text-muted-foreground">Доступ к архиву</p>
                        </div>
                        <Badge variant={selectedStaff.permissions?.chats?.closed ? 'default' : 'secondary'}>
                          {selectedStaff.permissions?.chats?.closed ? 'Да' : 'Нет'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">Управление сотрудниками</p>
                          <p className="text-xs text-muted-foreground">Создание и редактирование</p>
                        </div>
                        <Badge variant={selectedStaff.permissions?.staff?.manage ? 'default' : 'secondary'}>
                          {selectedStaff.permissions?.staff?.manage ? 'Да' : 'Нет'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">Полные настройки</p>
                          <p className="text-xs text-muted-foreground">Доступ ко всем разделам</p>
                        </div>
                        <Badge variant={selectedStaff.permissions?.settings?.full ? 'default' : 'secondary'}>
                          {selectedStaff.permissions?.settings?.full ? 'Да' : 'Нет'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Создан</Label>
                    <p className="text-sm">
                      {new Date(selectedStaff.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
