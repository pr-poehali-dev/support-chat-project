import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: number;
  apiBase: string;
  operators: any[];
  onSuccess: () => void;
}

export default function CloseDialog({
  open,
  onOpenChange,
  chatId,
  apiBase,
  operators,
  onSuccess,
}: CloseDialogProps) {
  const [resolution, setResolution] = useState<'resolved' | 'postponed' | 'escalated'>('resolved');
  const [comment, setComment] = useState('');
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeTime, setPostponeTime] = useState('');
  const [escalateToOperator, setEscalateToOperator] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setResolution('resolved');
      setComment('');
      setPostponeDate('');
      setPostponeTime('');
      setEscalateToOperator('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Комментарий обязателен',
        variant: 'destructive',
      });
      return;
    }

    if (resolution === 'postponed' && (!postponeDate || !postponeTime)) {
      toast({
        title: 'Ошибка',
        description: 'Укажите дату и время',
        variant: 'destructive',
      });
      return;
    }

    if (resolution === 'escalated' && !escalateToOperator) {
      toast({
        title: 'Ошибка',
        description: 'Выберите оператора',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const body: any = {
        id: chatId,
        status: resolution === 'escalated' ? 'active' : (resolution === 'postponed' ? 'postponed' : 'qc'),
        resolution,
        resolution_comment: comment,
      };

      if (resolution === 'postponed') {
        body.postponed_until = `${postponeDate}T${postponeTime}:00`;
      }

      if (resolution === 'escalated') {
        body.escalate_to_operator_id = parseInt(escalateToOperator);
      }

      const response = await fetch(apiBase, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Чат закрыт',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to close chat');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось закрыть чат',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Закрыть чат</DialogTitle>
          <DialogDescription>
            Выберите результат обработки чата
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Результат</Label>
            <RadioGroup value={resolution} onValueChange={(v: any) => setResolution(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resolved" id="resolved" />
                <Label htmlFor="resolved" className="cursor-pointer">Решено</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="postponed" id="postponed" />
                <Label htmlFor="postponed" className="cursor-pointer">Отложено</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="escalated" id="escalated" />
                <Label htmlFor="escalated" className="cursor-pointer">Эскалировать</Label>
              </div>
            </RadioGroup>
          </div>

          {resolution === 'postponed' && (
            <div className="space-y-2">
              <Label>До какого времени отложить?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  type="time"
                  value={postponeTime}
                  onChange={(e) => setPostponeTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {resolution === 'escalated' && (
            <div className="space-y-2">
              <Label>Кому эскалировать?</Label>
              <Select value={escalateToOperator} onValueChange={setEscalateToOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите оператора" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id.toString()}>
                      {op.name} ({op.role === 'okk' ? 'ОКК' : 'Оператор'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Опишите результат обработки чата"
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Закрываю...' : 'Закрыть чат'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
