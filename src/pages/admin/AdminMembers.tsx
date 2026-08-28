import { useRef, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useMembers,
  useCreateMember,
  useUpdateMember,
  useToggleMemberStatus,
  useDeleteMember,
  useLinkMemberToUser,
  useImportMembers,
} from '@/hooks/useMembers';
import { useUsers } from '@/hooks/useUsers';
import { Users, Plus, Pencil, Search, Power, Trash2, Link, Unlink, UserPlus, Download, Upload } from 'lucide-react';
import type { Member } from '@/hooks/useMembers';
import { Tables } from '@/integrations/supabase/types';
import { exportMembersXlsx, parseMembersXlsx, type MemberSheetRow } from '@/lib/membersSpreadsheet';
import { toast } from 'sonner';

export function AdminMembersContent() {
  const { data: members, isLoading } = useMembers(true);
  const { data: users } = useUsers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const toggleStatus = useToggleMemberStatus();
  const deleteMember = useDeleteMember();
  const linkMember = useLinkMemberToUser();
  const importMembers = useImportMembers();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [linkingMember, setLinkingMember] = useState<Member | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');
  const [importRows, setImportRows] = useState<MemberSheetRow[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    mbrf_id: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      mbrf_id: '',
      notes: '',
    });
    setEditingMember(null);
  };

  const openEditForm = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      cpf: member.cpf || '',
      mbrf_id: (member as any).mbrf_id || '',
      notes: member.notes || '',
    });
    setShowForm(true);
  };

  const openLinkDialog = (member: Member) => {
    setLinkingMember(member);
    setSelectedUserId(member.user_id || '');
    setShowLinkDialog(true);
  };

  const handleSubmit = async () => {
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      cpf: formData.cpf || null,
      mbrf_id: formData.mbrf_id || null,
      notes: formData.notes || null,
    };

    try {
      if (editingMember) {
        await updateMember.mutateAsync({ id: editingMember.id, data });
      } else {
        await createMember.mutateAsync(data);
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLink = async () => {
    if (!linkingMember) return;
    
    try {
      await linkMember.mutateAsync({ 
        memberId: linkingMember.id, 
        userId: selectedUserId || null 
      });
      setShowLinkDialog(false);
      setLinkingMember(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (member: Member) => {
    if (confirm(`Tem certeza que deseja remover o sócio "${member.name}"?`)) {
      await deleteMember.mutateAsync(member.id);
    }
  };

  const handleExport = async () => {
    if (!members) return;
    setIsExporting(true);
    try {
      await exportMembersXlsx(
        members
          .filter((m) => (m as any).mbrf_id)
          .map((m) => ({ mbrf_id: (m as any).mbrf_id as string, name: m.name }))
      );
    } catch (error) {
      toast.error('Erro ao gerar planilha: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const rows = await parseMembersXlsx(file);
      setImportRows(rows);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const importPreview = importRows
    ? (() => {
        const existingIds = new Set(
          (members || []).map((m) => (m as any).mbrf_id).filter(Boolean)
        );
        const activeIds = new Set(
          (members || []).filter((m) => m.is_active).map((m) => (m as any).mbrf_id).filter(Boolean)
        );
        const importedIds = new Set(importRows.map((r) => r.mbrf_id));
        const created = importRows.filter((r) => !existingIds.has(r.mbrf_id)).length;
        const updated = importRows.filter((r) => existingIds.has(r.mbrf_id)).length;
        const deactivated = [...activeIds].filter((id) => !importedIds.has(id as string)).length;
        return { total: importRows.length, created, updated, deactivated };
      })()
    : null;

  const handleConfirmImport = async () => {
    if (!importRows) return;
    try {
      await importMembers.mutateAsync(importRows);
      setImportRows(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredMembers = members?.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email?.toLowerCase().includes(search.toLowerCase()) ||
    member.cpf?.includes(search) ||
    (member as any).mbrf_id?.includes(search)
  );

  const getUserName = (userId: string | null) => {
    if (!userId) return null;
    const user = users?.find(u => u.id === userId);
    return user?.full_name || user?.email;
  };

  // Get users that are not already members
  const availableUsersToAdd = users?.filter(user => 
    !members?.some(member => member.user_id === user.id)
  );

  const handleAddUserAsMember = async () => {
    if (!selectedUserToAdd) return;
    const user = users?.find(u => u.id === selectedUserToAdd);
    if (!user) return;

    try {
      await createMember.mutateAsync({
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        user_id: user.id,
        mbrf_id: (user as any).mbrf_id || null,
      });
      setShowAddUserDialog(false);
      setSelectedUserToAdd('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <>
      <PageHeader
        title="Gerenciar Sócios"
        description="Cadastre e gerencie os sócios do clube"
        action={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none"
              size="sm"
              disabled={importMembers.isPending}
            >
              <Upload className="w-4 h-4 mr-1 sm:mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex-1 sm:flex-none"
              size="sm"
              disabled={isExporting || !members?.length}
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              {isExporting ? 'Gerando...' : 'Exportar'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddUserDialog(true)} className="flex-1 sm:flex-none" size="sm">
              <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Adicionar </span>Usuário
            </Button>
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="flex-1 sm:flex-none" size="sm">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo </span>Sócio
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou CPF..."
          className="pl-10 h-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{members?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total de Sócios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{members?.filter(m => m.is_active).length || 0}</div>
            <div className="text-sm text-muted-foreground">Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{members?.filter(m => !m.is_active).length || 0}</div>
            <div className="text-sm text-muted-foreground">Inativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{members?.filter(m => m.user_id).length || 0}</div>
            <div className="text-sm text-muted-foreground">Vinculados</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredMembers && filteredMembers.length > 0 ? (
        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                        <h3 className="font-semibold truncate text-sm sm:text-base">{member.name}</h3>
                        <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {member.user_id && (
                          <Badge variant="outline" className="text-success border-success text-[10px] sm:text-xs">
                            <Link className="w-3 h-3 mr-0.5" />
                            Vinc.
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        {member.email && <span className="truncate max-w-[180px]">{member.email}</span>}
                        {member.phone && <span>{member.phone}</span>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => openLinkDialog(member)} title={member.user_id ? 'Gerenciar vínculo' : 'Vincular conta'}>
                      {member.user_id ? <Unlink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => toggleStatus.mutate({ id: member.id, isActive: !member.is_active })} title={member.is_active ? 'Desativar' : 'Ativar'}>
                      <Power className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${member.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => openEditForm(member)}>
                      <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive" onClick={() => handleDelete(member)}>
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum sócio cadastrado"
          description="Adicione seu primeiro sócio para começar"
          action={{
            label: 'Adicionar Sócio',
            onClick: () => { resetForm(); setShowForm(true); },
          }}
        />
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } else setShowForm(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Editar Sócio' : 'Novo Sócio'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do sócio"
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mbrf_id">ID MBRF (6 dígitos)</Label>
              <Input
                id="mbrf_id"
                value={formData.mbrf_id}
                onChange={(e) => setFormData({ ...formData, mbrf_id: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o sócio..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || createMember.isPending || updateMember.isPending}
            >
              {createMember.isPending || updateMember.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link User Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={(open) => { if (!open) setShowLinkDialog(false); else setShowLinkDialog(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Conta de Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vincule este sócio a uma conta de usuário para que ele tenha acesso aos preços de sócio automaticamente.
            </p>
            
            <div className="space-y-2">
              <Label>Sócio</Label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{linkingMember?.name}</div>
                {linkingMember?.email && <div className="text-sm text-muted-foreground">{linkingMember.email}</div>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Conta de Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum (desvincular)</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLink}
              disabled={linkMember.isPending}
            >
              {linkMember.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Confirmation Dialog */}
      <Dialog open={!!importRows} onOpenChange={(open) => { if (!open) setImportRows(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {importPreview.total} linha(s) lida(s) da planilha. Revise antes de aplicar:
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-success">{importPreview.created}</div>
                  <div className="text-xs text-muted-foreground">Novos sócios</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-primary">{importPreview.updated}</div>
                  <div className="text-xs text-muted-foreground">Nomes atualizados</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-destructive">{importPreview.deactivated}</div>
                  <div className="text-xs text-muted-foreground">Serão desativados</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Sócios ativos que não aparecem nesta planilha serão marcados como inativos.
                Novos sócios entram como inativos por padrão.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportRows(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmImport} disabled={importMembers.isPending}>
              {importMembers.isPending ? 'Importando...' : 'Confirmar Importação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User as Member Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário como Sócio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione um usuário cadastrado para adicioná-lo como sócio automaticamente.
            </p>
            
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUserToAdd} onValueChange={setSelectedUserToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsersToAdd?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddUserAsMember}
              disabled={!selectedUserToAdd || createMember.isPending}
            >
              {createMember.isPending ? 'Adicionando...' : 'Adicionar como Sócio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminMembers() {
  return <AppLayout><AdminMembersContent /></AppLayout>;
}
