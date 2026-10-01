import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Shield, ArrowRight, Star, CheckCircle2, Clock } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <div className="relative">
        {/* Warm radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(30_25%_96%)_0%,_hsl(30_20%_90%)_100%)]" />
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-36">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center justify-center mb-10">
              <BrandLogo className="h-36 sm:h-44" alt="Ser Sadia Express" />
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground font-serif max-w-2xl mx-auto mb-4">
              Encontre seu espaço no Ser Sadia.
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Veja os espaços, confira os horários e escolha a melhor opção. Você só precisa entrar para concluir a reserva.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button size="lg" className="h-13 px-8 text-base shadow-lg" onClick={() => navigate('/locations')}>
                Explorar espaços
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="h-13 px-8 text-base" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-serif mb-3">
              Como funciona?
            </h2>
            <p className="text-muted-foreground">
              Escolha com calma, sem precisar criar uma conta para explorar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, icon: MapPin, title: 'Explore', description: 'Compare espaços, capacidade, horários e preços' },
              { step: 2, icon: Calendar, title: 'Escolha', description: 'Selecione uma data e um ou mais períodos no mesmo dia' },
              { step: 3, icon: CheckCircle2, title: 'Confirme', description: 'Entre na sua conta para reservar e receber as instruções de pagamento' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-serif mb-3">
            Tudo claro antes de reservar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            As informações importantes ficam reunidas em cada espaço.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MapPin, title: 'Espaços', description: 'Veja fotos, descrição e capacidade' },
            { icon: Calendar, title: 'Horários', description: 'Consulte os períodos antes de escolher' },
            { icon: Users, title: 'Preço de sócio', description: 'Compare o valor comum e o de sócio' },
            { icon: Shield, title: 'Regras', description: 'Saiba as condições do espaço antes de confirmar' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-2xl bg-card shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-serif mb-3">
              Por que usar o Ser Sadia Express?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Clock, title: 'Praticidade', description: 'Reserve espaços em segundos, sem burocracia. Tudo pelo celular ou computador.' },
              { icon: Star, title: 'Transparência', description: 'Acompanhe preços, horários disponíveis e status das reservas em tempo real.' },
              { icon: Shield, title: 'Confiança', description: 'Sistema seguro com controle de acesso, check-in digital e histórico completo.' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-background text-center shadow-sm"
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
      <div className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          className="relative rounded-3xl bg-primary p-10 sm:p-14 text-center overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground font-serif mb-4">
              Pronto para escolher seu espaço?
            </h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
              Explore as opções e veja os horários. O cadastro fica para a hora de reservar.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-13 px-10 text-base font-semibold"
              onClick={() => navigate('/locations')}
            >
              Ver espaços
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <BrandLogo className="h-16" alt="Ser Sadia Express" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ser Sadia Express. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
