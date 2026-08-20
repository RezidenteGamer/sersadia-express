import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export function PasswordRecoveryModal() {
  const { passwordRecovery, dismissPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleSkip = () => {
    reset();
    dismissPasswordRecovery();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Senha atualizada com sucesso!');
    reset();
    dismissPasswordRecovery();
  };

  return (
    <Dialog open={passwordRecovery} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deseja trocar sua senha?</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para sua conta. Se preferir, pode fazer isso depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-password">Nova senha</Label>
            <Input
              id="recovery-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovery-confirm-password">Repita a senha</Label>
            <Input
              id="recovery-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleSkip} disabled={loading}>
              Agora não
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Trocar senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
