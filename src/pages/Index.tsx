import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Shield, ArrowRight, Star, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center justify-center mb-8">
              <BrandLogo className="h-48 sm:h-64" alt="Ser Sadia Express" />
            </motion.div>
            <h1 className="sr-only">Ser Sadia Express</h1>
            <motion.p variants={fadeUp} custom={1} className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
              A melhor forma de realizar reservas no Ser Sadia!
            </motion.p>
            <motion.p variants={fadeUp} custom={2} className="text-base text-muted-foreground/70 max-w-xl mx-auto mb-10">
              Agende espaços, controle presenças e gerencie pagamentos — tudo em um só lugar.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 text-lg shadow-lg shadow-primary/25" onClick={() => navigate('/auth?mode=signup')}>
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg" onClick={() => navigate('/auth')}>
                Fazer Login
              </Button>
              <Button size="lg" variant="ghost" className="h-14 px-8 text-lg" onClick={() => navigate('/locations')}>
                <MapPin className="w-5 h-5 mr-2" />
                Ver Locais Disponíveis
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Em apenas 3 passos simples
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, icon: Smartphone, title: 'Cadastre-se', description: 'Crie sua conta gratuitamente em menos de 1 minuto' },
              { step: 2, icon: Calendar, title: 'Reserve', description: 'Escolha o espaço, data e horário que desejar' },
              { step: 3, icon: CheckCircle2, title: 'Aproveite', description: 'Compareça ao local e aproveite o espaço reservado' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie reservas, controle presenças e acompanhe pagamentos em um só lugar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: MapPin, title: 'Locais', description: 'Cadastre e gerencie múltiplos espaços' },
            { icon: Calendar, title: 'Reservas', description: 'Sistema completo de agendamentos' },
            { icon: Users, title: 'Check-in', description: 'Controle de presença simplificado' },
            { icon: Shield, title: 'Segurança', description: 'Permissões e acessos configuráveis' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefícios / Depoimentos */}
      <div className="bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Por que usar o Ser Sadia Express?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Clock, title: 'Praticidade', description: 'Reserve espaços em segundos, sem burocracia. Tudo pelo celular ou computador.' },
              { icon: Star, title: 'Transparência', description: 'Acompanhe preços, horários disponíveis e status das reservas em tempo real.' },
              { icon: Shield, title: 'Confiança', description: 'Sistema seguro com controle de acesso, check-in digital e histórico completo.' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-card border text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          className="relative rounded-3xl bg-primary p-12 text-center overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
              Pronto para começar?
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
              Crie sua conta agora e comece a reservar os melhores espaços do Ser Sadia.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-10 text-lg font-semibold"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Criar Conta Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <BrandLogo className="h-24" alt="Ser Sadia Express" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ser Sadia Express. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
