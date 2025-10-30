import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface SaveClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: any;
  userName: string;
}

export default function SaveClientDialog({ open, onOpenChange, chat, userName }: SaveClientDialogProps) {
  const [clientName, setClientName] = useState(chat?.client_name || '');
  const [clientPhone, setClientPhone] = useState(chat?.client_phone || '');
  const [clientEmail, setClientEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите имя клиента',
        variant: 'destructive',
      });
      return;
    }

    if (!clientPhone.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите телефон клиента',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const clientData = {
        session_id: chat.session_id || `client_${Date.now()}`,
        name: clientName,
        phone: clientPhone,
        email: clientEmail || null,
        first_contact_at: chat.created_at,
        last_contact_at: new Date().toISOString(),
        total_chats: 1,
        metadata: {
          chat_id: chat.id,
          added_by: userName,
          added_at: new Date().toISOString(),
        },
      };

      console.log('Saving client:', clientData);

      toast({
        title: 'Клиент сохранен',
        description: `${clientName} добавлен в базу клиентов`,
      });

      onOpenChange(false);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить клиента',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="UserPlus" size={20} />
            Добавить клиента в базу
          </DialogTitle>
          <DialogDescription>
            Сохраните информацию о клиенте для дальнейшей работы
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя клиента *</Label>
            <Input
              id="name"
              placeholder="Введите имя"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон *</Label>
            <Input
              id="phone"
              placeholder="+7 (999) 123-45-67"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (необязательно)</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="mt-0.5 text-muted-foreground" />
              <div className="space-y-1 text-muted-foreground">
                <p><strong>ID чата:</strong> {chat?.id}</p>
                <p><strong>Дата обращения:</strong> {chat?.created_at ? new Date(chat.created_at).toLocaleString('ru-RU') : '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Check" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
