import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers, useUpdateUserRole, useUpdateUserPermissions, UserWithRole } from '@/hooks/useUsers';
import { format } from 'date-fns';
import { Users, Search, Settings, Shield, User, Mail, Phone, Calendar } from 'lucide-react';

const PERMISSION_LABELS: Record<string, string> = {
  manage_locations: 'Gerenciar Locais',
  manage_reservations: 'Gerenciar Reservas',
  manage_users: 'Gerenciar Usuários',
  manage_members: 'Gerenciar Sócios',
  manage_payments: 'Gerenciar Pagamentos',
  manage_checkin: 'Gerenciar Check-in',
  manage_banners: 'Gerenciar Banners',
  view_reports: 'Visualizar Relatórios',
  view_financial_reports: 'Relatórios Financeiros',
  manage_support: 'Gerenciar Suporte',
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

export function AdminUsersContent() {
  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const updatePermissions = useUpdateUserPermissions();
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const openEditDialog = (user: UserWithRole) => {
    setEditUser(user);
    setSelectedRole(user.role?.role || 'user');
    setSelectedPermissions(user.permissions?.map(p => p.permission) || []);
  };

  const handleSave = async () => {
    if (!editUser) return;
    
    try {
      await updateRole.mutateAsync({ userId: editUser.id, role: selectedRole });
      
      if (selectedRole === 'admin') {
        await updatePermissions.mutateAsync({ userId: editUser.id, permissions: selectedPermissions });
      } else {
        await updatePermissions.mutateAsync({ userId: editUser.id, permissions: [] });
      }
      
      setEditUser(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.role?.role === 'admin') ||
      (roleFilter === 'user' && user.role?.role !== 'admin');
    
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <PageHeader
        title="Gerenciar Usuários"
        description="Gerencie papéis e permissões dos usuários"
      />

      {/* Filters */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-lg">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{user.full_name}</h3>
                      <Badge variant={user.role?.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role?.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Desde {format(new Date(user.created_at), 'MM/yyyy')}</span>
                      </div>
                    </div>
                    {user.permissions && user.permissions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.permissions.map(p => (
                          <Badge key={p.id} variant="outline" className="text-xs">
                            {PERMISSION_LABELS[p.permission] || p.permission}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(user)}
                    title="Configurar permissões"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum usuário encontrado"
          description="Não há usuários com os filtros selecionados"
        />
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configurar Permissões
            </DialogTitle>
          </DialogHeader>
          
          {editUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {editUser.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{editUser.full_name}</p>
                  <p className="text-sm text-muted-foreground">{editUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Papel do Usuário</Label>
                <Select value={selectedRole} onValueChange={(v: 'admin' | 'user') => setSelectedRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRole === 'admin' && (
                <div className="space-y-3">
                  <Label>Permissões</Label>
                  <div className="space-y-2">
                    {ALL_PERMISSIONS.map(permission => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <label
                          htmlFor={permission}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {PERMISSION_LABELS[permission]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateRole.isPending || updatePermissions.isPending}
            >
              {updateRole.isPending || updatePermissions.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminUsers() {
  return <AppLayout><AdminUsersContent /></AppLayout>;
}
