import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface MessageListProps {
  messages: any[];
  userId: number;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  loading?: boolean;
}

export default function MessageList({
  messages,
  userId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  loading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOperator = msg.sender_type === 'operator';
            const isCurrentUser = isOperator && msg.sender_id === userId;

            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : isOperator
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        {isOperator ? msg.sender_name : 'Клиент'}
                      </Badge>
                    )}
                    <span className="text-xs opacity-70">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Введите сообщение..."
            className="min-h-[80px] resize-none"
            disabled={loading}
          />
          <Button onClick={onSendMessage} disabled={!newMessage.trim() || loading}>
            <Icon name="Send" size={20} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter для отправки, Shift+Enter для новой строки
        </p>
      </div>
    </div>
  );
}
