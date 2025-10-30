import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface JiraViewProps {
  user: any;
}

const API_BASE = 'https://functions.poehali.dev/jira';

const PRIORITIES = {
  low: { label: 'Низкий', color: 'secondary' },
  medium: { label: 'Средний', color: 'default' },
  high: { label: 'Высокий', color: 'destructive' },
  critical: { label: 'Критичный', color: 'destructive' },
};

const STATUSES = {
  new: { label: 'Новая', color: 'outline' },
  in_progress: { label: 'В работе', color: 'default' },
  done: { label: 'Выполнена', color: 'secondary' },
  cancelled: { label: 'Отменена', color: 'destructive' },
};

export default function JiraView({ user }: JiraViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canProcess = user.role === 'superadmin' || user.role === 'okk';

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, selectedStatus]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить задачи',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    if (selectedStatus === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === selectedStatus));
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          due_date: dueDate || null,
          created_by: user.id,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Задача создана',
        });
        setShowCreateDialog(false);
        resetForm();
        loadTasks();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать задачу',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTask = async (taskId: number, updates: any) => {
    try {
      const response = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          ...updates,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Задача обновлена',
        });
        loadTasks();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить задачу',
        variant: 'destructive',
      });
    }
  };

  const handleTakeTask = async (task: any) => {
    await handleUpdateTask(task.id, {
      status: 'in_progress',
      assigned_to: user.id,
    });
  };

  const handleCompleteTask = async () => {
    if (!resolutionComment.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте комментарий к решению',
        variant: 'destructive',
      });
      return;
    }

    await handleUpdateTask(selectedTask.id, {
      status: 'done',
      resolution_comment: resolutionComment,
    });
    setShowEditDialog(false);
    setSelectedTask(null);
    setResolutionComment('');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  };

  const openTaskDetails = (task: any) => {
    setSelectedTask(task);
    setShowEditDialog(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Jira Portal</h1>
          <p className="text-muted-foreground">Управление задачами и тикетами</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать задачу
        </Button>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Все ({tasks.length})</TabsTrigger>
          <TabsTrigger value="new">Новые ({tasks.filter(t => t.status === 'new').length})</TabsTrigger>
          <TabsTrigger value="in_progress">В работе ({tasks.filter(t => t.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="done">Выполнены ({tasks.filter(t => t.status === 'done').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openTaskDetails(task)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge variant={PRIORITIES[task.priority as keyof typeof PRIORITIES].color as any}>
                    {PRIORITIES[task.priority as keyof typeof PRIORITIES].label}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {task.description || 'Нет описания'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Статус:</span>
                    <Badge variant={STATUSES[task.status as keyof typeof STATUSES].color as any}>
                      {STATUSES[task.status as keyof typeof STATUSES].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Автор:</span>
                    <span>{task.creator_name}</span>
                  </div>
                  {task.assignee_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Исполнитель:</span>
                      <span>{task.assignee_name}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Срок:</span>
                      <span>{new Date(task.due_date).toLocaleDateString('ru-RU')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать задачу</DialogTitle>
            <DialogDescription>
              Заполните информацию о новой задаче
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Краткое описание задачи"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробное описание задачи"
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Срок выполнения</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateTask}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTask && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>
                Создано {new Date(selectedTask.created_at).toLocaleString('ru-RU')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Описание</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description || 'Нет описания'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Приоритет</h4>
                  <Badge variant={PRIORITIES[selectedTask.priority as keyof typeof PRIORITIES].color as any}>
                    {PRIORITIES[selectedTask.priority as keyof typeof PRIORITIES].label}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Статус</h4>
                  <Badge variant={STATUSES[selectedTask.status as keyof typeof STATUSES].color as any}>
                    {STATUSES[selectedTask.status as keyof typeof STATUSES].label}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1">Автор</h4>
                <p className="text-sm">{selectedTask.creator_name}</p>
              </div>

              {selectedTask.assignee_name && (
                <div>
                  <h4 className="font-medium mb-1">Исполнитель</h4>
                  <p className="text-sm">{selectedTask.assignee_name}</p>
                </div>
              )}

              {selectedTask.resolution_comment && (
                <div>
                  <h4 className="font-medium mb-1">Комментарий к решению</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.resolution_comment}</p>
                </div>
              )}

              {canProcess && selectedTask.status === 'in_progress' && (
                <div className="space-y-2">
                  <Label>Комментарий к решению</Label>
                  <Textarea
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    placeholder="Опишите результат выполнения задачи"
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              {canProcess && selectedTask.status === 'new' && (
                <Button onClick={() => handleTakeTask(selectedTask)}>
                  <Icon name="UserCheck" size={16} className="mr-2" />
                  Взять в работу
                </Button>
              )}
              {canProcess && selectedTask.status === 'in_progress' && (
                <Button onClick={handleCompleteTask}>
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  Завершить
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
