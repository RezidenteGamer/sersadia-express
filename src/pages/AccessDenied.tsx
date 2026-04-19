import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AccessDeniedProps {
  requiredPermission?: string;
}

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
  manage_pix: 'Gerenciar PIX',
};

export default function AccessDenied({ requiredPermission }: AccessDeniedProps) {
  const navigate = useNavigate();
  const label = requiredPermission ? PERMISSION_LABELS[requiredPermission] ?? requiredPermission : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-serif font-semibold">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não possui permissão para acessar esta área do painel administrativo.
          </p>
          {label && (
            <p className="text-sm bg-muted px-3 py-2 rounded-md">
              Permissão necessária: <span className="font-medium">{label}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Solicite acesso ao administrador responsável caso precise utilizar este recurso.
          </p>
          <div className="flex gap-2 pt-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button className="flex-1" onClick={() => navigate('/admin')}>
              Painel Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
