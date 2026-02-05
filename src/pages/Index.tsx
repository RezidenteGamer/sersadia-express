import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Shield, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
export default function Index() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-8">
              <BrandLogo className="h-32 sm:h-40" alt="Ser Sadia Express" />
            </div>
            <h1 className="sr-only">Ser Sadia Express</h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A melhor forma de realizar reservas no Ser Sadia!        
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-lg" onClick={() => navigate('/auth?mode=signup')}>
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg" onClick={() => navigate('/auth')}>
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie reservas, controle presenças e acompanhe pagamentos em um só lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[{
          icon: MapPin,
          title: 'Locais',
          description: 'Cadastre e gerencie múltiplos espaços'
        }, {
          icon: Calendar,
          title: 'Reservas',
          description: 'Sistema completo de agendamentos'
        }, {
          icon: Users,
          title: 'Check-in',
          description: 'Controle de presença simplificado'
        }, {
          icon: Shield,
          title: 'Segurança',
          description: 'Permissões e acessos configuráveis'
        }].map((feature, index) => <div key={index} className="text-center p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>)}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <BrandLogo className="h-16" alt="Ser Sadia Express" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ser Sadia Express. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>;
}