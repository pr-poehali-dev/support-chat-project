import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface NewsViewProps {
  user: any;
}

export default function NewsView({ user }: NewsViewProps) {
  const [news, setNews] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canEdit = user.role === 'editor' || user.role === 'super_admin';

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      // TODO: Add backend function for news
      // const response = await fetch('NEWS_API_URL');
      // if (response.ok) {
      //   const data = await response.json();
      //   setNews(data);
      // }
      setNews([]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить новости',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      // TODO: Add backend function for news
      // const method = editingNews ? 'PUT' : 'POST';
      // const response = await fetch('NEWS_API_URL', {
      //   method,
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     id: editingNews?.id,
      //     title,
      //     content,
      //     author_id: user.id,
      //     author_name: user.name,
      //   }),
      // });

      toast({
        title: 'Успешно',
        description: editingNews ? 'Новость обновлена' : 'Новость создана',
      });
      setShowDialog(false);
      setTitle('');
      setContent('');
      setEditingNews(null);
      loadNews();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить новость',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить новость?')) return;

    try {
      // TODO: Add backend function for news
      // await fetch(`NEWS_API_URL?id=${id}`, { method: 'DELETE' });
      toast({
        title: 'Успешно',
        description: 'Новость удалена',
      });
      loadNews();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить новость',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (newsItem?: any) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setTitle(newsItem.title);
      setContent(newsItem.content);
    } else {
      setEditingNews(null);
      setTitle('');
      setContent('');
    }
    setShowDialog(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Новости</h1>
          <p className="text-muted-foreground">Актуальные новости и объявления</p>
        </div>
        {canEdit && (
          <Button onClick={() => openEditDialog()}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать новость
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid gap-4">
          {news.length === 0 ? (
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Icon name="Newspaper" size={64} className="mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">Новостей пока нет</p>
                {canEdit && (
                  <Button onClick={() => openEditDialog()} className="mt-4" variant="outline">
                    Создать первую новость
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Icon name="User" size={14} />
                          {item.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          {new Date(item.published_at).toLocaleDateString('ru-RU')}
                        </span>
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}>
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{item.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? 'Редактировать новость' : 'Создать новость'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о новости
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Заголовок *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок новости"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Содержание *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите текст новости"
                className="mt-1 min-h-[200px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              <Icon name="Save" size={16} className="mr-2" />
              {editingNews ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
