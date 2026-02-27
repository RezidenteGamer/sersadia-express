import { useState } from 'react';
import { useDependents, useCreateDependent, useDeleteDependent } from '@/hooks/useDependents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Users, AlertTriangle } from 'lucide-react';
import { differenceInYears, parse } from 'date-fns';
import { toast } from 'sonner';

interface DependentsListProps {
  memberId: string;
}

const relationshipLabels: Record<string, string> = {
  filho: 'Filho',
  filha: 'Filha',
  conjuge: 'Cônjuge',
};

export function DependentsList({ memberId }: DependentsListProps) {
  const { data: dependents = [], isLoading } = useDependents(memberId);
  const createDependent = useCreateDependent();
  const deleteDependent = useDeleteDependent();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<string>('');
  const [birthDate, setBirthDate] = useState('');
  const [ageWarning, setAgeWarning] = useState(false);

  const isChild = relationship === 'filho' || relationship === 'filha';

  const handleBirthDateChange = (value: string) => {
    setBirthDate(value);
    if (value && isChild) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      const age = differenceInYears(new Date(), parsed);
      setAgeWarning(age >= 18);
    } else {
      setAgeWarning(false);
    }
  };

  const handleRelationshipChange = (value: string) => {
    setRelationship(value);
    if (value === 'conjuge') {
      setAgeWarning(false);
    } else if (birthDate) {
      const parsed = parse(birthDate, 'yyyy-MM-dd', new Date());
      const age = differenceInYears(new Date(), parsed);
      setAgeWarning(age >= 18);
    }
  };

  const resetForm = () => {
    setName('');
    setRelationship('');
    setBirthDate('');
    setAgeWarning(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !relationship) {
      toast.error('Preencha nome e parentesco');
      return;
    }

    if (isChild && !birthDate) {
      toast.error('Informe a data de nascimento do(a) filho(a)');
      return;
    }

    if (ageWarning) {
      toast.error('Não é possível adicionar dependentes maiores de 18 anos como filho(a)');
      return;
    }

    createDependent.mutate(
      {
        member_id: memberId,
        name: name.trim(),
        relationship,
        birth_date: birthDate || null,
      },
      {
        onSuccess: () => {
          resetForm();
          setShowAddDialog(false);
        },
      }
    );
  };

  return (
    <div className="w-[340px] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="w-4 h-4" />
          Dependentes
        </div>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-3 h-3" />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>
      ) : dependents.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum dependente cadastrado</p>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {dependents.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{dep.name}</p>
                <p className="text-xs text-muted-foreground">{relationshipLabels[dep.relationship] || dep.relationship}</p>
              </div>
              <button
                onClick={() => setDeleteId(dep.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-base">Adicionar Dependente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Parentesco</label>
              <Select value={relationship} onValueChange={handleRelationshipChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filho">Filho</SelectItem>
                  <SelectItem value="filha">Filha</SelectItem>
                  <SelectItem value="conjuge">Cônjuge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isChild && (
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Data de Nascimento</label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {ageWarning && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive font-medium">
                      Dependentes maiores de 18 anos não podem ser adicionados como filho(a) na carteirinha digital.
                    </p>
                  </div>
                )}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={createDependent.isPending || ageWarning} className="w-full">
              {createDependent.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover dependente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteDependent.mutate(deleteId); setDeleteId(null); }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
