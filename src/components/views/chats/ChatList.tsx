import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ChatListProps {
  chats: any[];
  selectedChatId: number | null;
  onSelectChat: (chat: any) => void;
  showStatus?: boolean;
}

export default function ChatList({ chats, selectedChatId, onSelectChat, showStatus = false }: ChatListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusBadge = (status: string, qcStatus?: string) => {
    if (status === 'active') {
      return <Badge variant="default">Активен</Badge>;
    }
    if (status === 'qc') {
      if (qcStatus === 'processing_qc') {
        return <Badge variant="secondary">Обработка QC</Badge>;
      }
      return <Badge variant="outline">QC</Badge>;
    }
    if (status === 'closed') {
      return <Badge variant="secondary">Закрыт</Badge>;
    }
    return null;
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <Icon name="MessageSquare" size={48} className="mb-4 opacity-50" />
        <p>Нет чатов</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-2">
        {chats.map((chat) => (
          <Card
            key={chat.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedChatId === chat.id ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="User" size={16} />
                <span className="font-medium">{chat.client_name || 'Клиент'}</span>
                {chat.priority && (
                  <Badge variant={getPriorityColor(chat.priority)} className="text-xs">
                    {chat.priority === 'high' ? 'Высокий' : chat.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(chat.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {chat.last_message || 'Нет сообщений'}
              </p>
              {showStatus && getStatusBadge(chat.status, chat.qc_status)}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
