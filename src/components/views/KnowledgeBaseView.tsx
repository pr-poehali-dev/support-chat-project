import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeBaseViewProps {
  user: any;
}

const CATEGORIES = [
  'Общие вопросы',
  'Технические инструкции',
  'Работа с клиентами',
  'Процедуры и регламенты',
  'FAQ',
  'Прочее'
];

export default function KnowledgeBaseView({ user }: KnowledgeBaseViewProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const canEdit = user.role === 'editor' || user.role === 'superadmin';

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedCategory, searchQuery]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      // TODO: Add backend function for knowledge base
      // const response = await fetch('KB_API_URL');
      // if (response.ok) {
      //   const data = await response.json();
      //   setArticles(data);
      // }
      setArticles([]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить базу знаний',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.tags?.some((t: string) => t.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
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
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

      // TODO: Add backend function for knowledge base
      // const method = editingArticle ? 'PUT' : 'POST';
      // const response = await fetch('KB_API_URL', {
      //   method,
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     id: editingArticle?.id,
      //     title,
      //     content,
      //     category,
      //     tags: tagsArray,
      //     author_id: user.id,
      //     author_name: user.name,
      //   }),
      // });

      toast({
        title: 'Успешно',
        description: editingArticle ? 'Статья обновлена' : 'Статья создана',
      });
      setShowDialog(false);
      resetForm();
      loadArticles();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить статью',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить статью?')) return;

    try {
      // TODO: Add backend function for knowledge base
      // await fetch(`KB_API_URL?id=${id}`, { method: 'DELETE' });
      toast({
        title: 'Успешно',
        description: 'Статья удалена',
      });
      loadArticles();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить статью',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (article?: any) => {
    if (article) {
      setEditingArticle(article);
      setTitle(article.title);
      setContent(article.content);
      setCategory(article.category);
      setTags(article.tags?.join(', ') || '');
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setTitle('');
    setContent('');
    setCategory(CATEGORIES[0]);
    setTags('');
  };

  const incrementViews = async (id: string) => {
    // TODO: Add backend function to increment views
    // await fetch(`KB_API_URL/views?id=${id}`, { method: 'POST' });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">База знаний</h1>
          <p className="text-muted-foreground">Инструкции, регламенты и полезная информация</p>
        </div>
        {canEdit && (
          <Button onClick={() => openEditDialog()}>
            <Icon name="Plus" size={16} className="mr-2" />
            Создать статью
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по статьям..."
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Все</TabsTrigger>
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="grid gap-4">
          {filteredArticles.length === 0 ? (
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Icon name="BookOpen" size={64} className="mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery ? 'Ничего не найдено' : 'Статей пока нет'}
                </p>
                {canEdit && !searchQuery && (
                  <Button onClick={() => openEditDialog()} className="mt-4" variant="outline">
                    Создать первую статью
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card 
                key={article.id} 
                className="border-primary/20 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => incrementViews(article.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{article.category}</Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Icon name="Eye" size={12} />
                          {article.views_count || 0}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{article.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Icon name="User" size={14} />
                          {article.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          {new Date(article.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(article)}>
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(article.id)}>
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap line-clamp-3 mb-3">{article.content}</p>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {article.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Редактировать статью' : 'Создать статью'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о статье базы знаний
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Категория *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Заголовок *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок статьи"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Содержание *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите текст статьи"
                className="mt-1 min-h-[300px]"
              />
            </div>

            <div>
              <Label>Теги (через запятую)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="например: инструкция, важно, процедура"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              <Icon name="Save" size={16} className="mr-2" />
              {editingArticle ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}