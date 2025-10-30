import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ChatTimerProps {
  chat: any;
  apiBase: string;
  onChatUpdate: (chat: any) => void;
  onChatTransfer: () => void;
}

const CHAT_TIMEOUT = 15 * 60 * 1000;
const WARNING_TIME = 2 * 60 * 1000;

export default function ChatTimer({ chat, apiBase, onChatUpdate, onChatTransfer }: ChatTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chat) {
      startChatTimer(chat);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [chat]);

  const startChatTimer = (chatData: any) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const startTime = chatData.timer_expires_at 
      ? new Date(chatData.timer_expires_at).getTime() - CHAT_TIMEOUT 
      : Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = CHAT_TIMEOUT - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setShowTimeoutDialog(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        setTimeRemaining(remaining);
        
        if (remaining <= WARNING_TIME && remaining > WARNING_TIME - 1000) {
          toast({
            title: 'Внимание!',
            description: `Осталось ${Math.ceil(remaining / 60000)} минут для обработки чата`,
            variant: 'destructive',
          });
        }
      }
    }, 1000);
  };

  const extendChatTime = async () => {
    if (!chat) return;
    
    try {
      const response = await fetch(apiBase, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chat.id,
          extend_timer: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Время обработки продлено на 15 минут',
        });
        setShowTimeoutDialog(false);
        const updatedChat = await response.json();
        onChatUpdate(updatedChat);
        startChatTimer(updatedChat);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось продлить время',
        variant: 'destructive',
      });
    }
  };

  const transferChat = async () => {
    if (!chat) return;

    try {
      const response = await fetch(apiBase, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chat.id,
          transfer_to_next: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Чат передан другому оператору',
        });
        setShowTimeoutDialog(false);
        onChatTransfer();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось передать чат',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (ms: number) => {
    if (ms <= WARNING_TIME) return 'destructive';
    return 'default';
  };

  if (!timeRemaining) return null;

  return (
    <>
      <Badge variant={getTimerColor(timeRemaining)}>
        <Icon name="Clock" size={14} className="mr-1" />
        {formatTime(timeRemaining)}
      </Badge>

      <Dialog open={showTimeoutDialog} onOpenChange={setShowTimeoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Время обработки истекло</DialogTitle>
            <DialogDescription>
              Вы можете продлить время или передать чат другому оператору
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={transferChat}>
              Передать другому
            </Button>
            <Button onClick={extendChatTime}>
              Продлить на 15 минут
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
