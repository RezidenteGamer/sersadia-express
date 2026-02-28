import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Users, BookOpen, UserCheck, CreditCard, AlertTriangle, Clock, MapPin, Bell, Settings, Headset, Ban } from 'lucide-react';

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        {children}
      </CardContent>
    </Card>
  );
}

function AdminManual() {
  return (
    <div className="space-y-6">
      <SectionCard icon={MapPin} title="Gerenciamento de Locais">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="criar">
            <AccordionTrigger>Criar um novo local</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
                <li>Acesse o módulo <strong>Locais</strong> no painel administrativo.</li>
                <li>Clique em <strong>"Novo Local"</strong>.</li>
                <li>Preencha o nome, descrição, capacidade e regras de uso.</li>
                <li>Configure os <strong>períodos disponíveis</strong> (ex: 08:00–17:00 e 18:30–01:30).</li>
                <li>Defina os <strong>preços</strong>: valor fixo ou por período, com preços diferenciados para sócios.</li>
                <li>Configure a <strong>política de cancelamento</strong>: tipo de multa (fixa ou percentual), valor e prazo em horas.</li>
                <li>Faça upload das <strong>fotos</strong> do espaço.</li>
                <li>Salve o local. Ele ficará ativo automaticamente.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="editar">
            <AccordionTrigger>Editar ou desativar um local</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                <li>No módulo Locais, clique no ícone de edição ao lado do local desejado.</li>
                <li>Altere as informações necessárias e salve.</li>
                <li>Para <strong>desativar</strong>, use o botão de toggle. Locais desativados não aparecem para os usuários.</li>
                <li>A <strong>ordem de exibição</strong> pode ser alterada arrastando os locais na lista.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionCard>

      <SectionCard icon={Users} title="Gerenciamento de Usuários e Permissões">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="roles">
            <AccordionTrigger>Papéis e permissões</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>O sistema possui dois papéis principais:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Usuário:</strong> Acesso ao painel do cliente (reservas, perfil, suporte).</li>
                  <li><strong>Admin:</strong> Acesso completo ao painel administrativo.</li>
                </ul>
                <p className="mt-2">Administradores possuem <strong>permissões granulares</strong>:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Gerenciar Locais:</strong> Criar, editar e desativar espaços.</li>
                  <li><strong>Gerenciar Reservas:</strong> Aprovar, rejeitar, cancelar e reagendar.</li>
                  <li><strong>Gerenciar Usuários:</strong> Alterar papéis e permissões.</li>
                  <li><strong>Gerenciar Pagamentos:</strong> Registrar pagamentos e processar reembolsos.</li>
                  <li><strong>Gerenciar Check-in:</strong> Confirmar presença nas reservas.</li>
                  <li><strong>Visualizar Relatórios:</strong> Acessar dados financeiros e operacionais.</li>
                  <li><strong>Gerenciar Suporte:</strong> Responder tickets de atendimento.</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="criar-admin">
            <AccordionTrigger>Como criar um administrador</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
                <li>Acesse o módulo <strong>Usuários</strong>.</li>
                <li>Localize o usuário desejado pela busca.</li>
                <li>Altere o papel para <strong>"Admin"</strong>.</li>
                <li>Selecione as <strong>permissões específicas</strong> que o administrador terá.</li>
                <li>O usuário terá acesso imediato ao painel administrativo no próximo login.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionCard>

      <SectionCard icon={CreditCard} title="Gerenciamento Financeiro">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="pagamentos">
            <AccordionTrigger>Pagamentos e confirmações</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>O sistema processa pagamentos exclusivamente via <strong>PIX (Mercado Pago)</strong>.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Pagamentos aprovados <strong>confirmam automaticamente</strong> a reserva.</li>
                  <li>O painel <strong>Pagamentos</strong> mostra todos os registros com filtros por status.</li>
                  <li>Administradores podem registrar pagamentos manuais quando necessário.</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="reembolsos">
            <AccordionTrigger>Processamento de reembolsos</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Reembolsos podem ser processados de duas formas:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li><strong>Automático:</strong> Quando o usuário cancela a reserva, o sistema calcula a multa e processa o reembolso parcial ou total automaticamente.</li>
                  <li><strong>Manual:</strong> No painel de reservas, o admin pode ajustar o valor do reembolso antes de cancelar.</li>
                </ul>
                <p className="mt-2">O reembolso é processado diretamente pelo Mercado Pago e o valor é devolvido para a conta do usuário.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SectionCard>

      <SectionCard icon={Bell} title="Notificações e Banners">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Notificações automáticas</strong> são enviadas para:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Confirmação de pagamento</li>
            <li>Alteração de status da reserva</li>
            <li>Check-in realizado</li>
            <li>Expiração de reserva pendente</li>
            <li>Reembolso processado</li>
          </ul>
          <p className="mt-3"><strong>Banners promocionais</strong> podem ser gerenciados no módulo Banners. Defina título, imagem, link de redirecionamento e ordem de exibição.</p>
        </div>
      </SectionCard>
    </div>
  );
}

function UserManual() {
  return (
    <div className="space-y-6">
      <SectionCard icon={BookOpen} title="Como Fazer uma Reserva">
        <ol className="list-decimal pl-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <strong>Escolha o local:</strong> Acesse a página <strong>Locais</strong> e selecione o espaço desejado.
          </li>
          <li>
            <strong>Selecione a data:</strong> No calendário, escolha a data desejada. Datas passadas não podem ser selecionadas.
          </li>
          <li>
            <strong>Escolha o período:</strong> Selecione um dos períodos disponíveis (ex: Manhã 08:00–17:00 ou Noite 18:30–01:30). Períodos ocupados aparecem desabilitados.
          </li>
          <li>
            <strong>Confirme e pague:</strong> Revise os detalhes, aceite as regras do local e clique em "Solicitar Reserva". Você será redirecionado para o pagamento via PIX.
          </li>
          <li>
            <strong>Acompanhe:</strong> Após o pagamento, sua reserva será confirmada automaticamente. Acompanhe o status em <strong>Minhas Reservas</strong>.
          </li>
        </ol>
      </SectionCard>

      <SectionCard icon={CreditCard} title="Pagamento">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>O pagamento é realizado exclusivamente via <strong>PIX</strong>.</p>
          <ul className="list-disc pl-4 space-y-2">
            <li>Após criar a reserva, você será redirecionado para a página de pagamento do Mercado Pago.</li>
            <li>Escaneie o QR Code com o aplicativo do seu banco ou copie o código PIX.</li>
            <li>Após o pagamento, a reserva é <strong>confirmada automaticamente</strong>.</li>
            <li>Se não pagar em <strong>30 minutos</strong>, a reserva expira automaticamente.</li>
            <li>Caso o pagamento falhe, você pode tentar novamente em <strong>Minhas Reservas</strong>.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard icon={Ban} title="Cancelamento">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Você pode cancelar uma reserva pendente a qualquer momento.</p>
          <ul className="list-disc pl-4 space-y-2">
            <li>Acesse <strong>Minhas Reservas</strong> e clique no ícone de cancelamento.</li>
            <li>Se o cancelamento for feito <strong>dentro do prazo limite</strong>, uma multa pode ser aplicada conforme as regras do local.</li>
            <li>O sistema calcula automaticamente o valor da multa e do reembolso.</li>
            <li>O reembolso (se aplicável) é processado automaticamente para sua conta.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard icon={Headset} title="Suporte">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Se tiver dúvidas ou problemas:</p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>Acesse o menu <strong>Suporte</strong> na barra lateral.</li>
            <li>Crie um novo ticket descrevendo sua dúvida ou problema.</li>
            <li>Acompanhe as respostas da equipe diretamente pelo chat do ticket.</li>
            <li>Ao resolver o problema, avalie o atendimento.</li>
          </ol>
        </div>
      </SectionCard>
    </div>
  );
}

function RefundPolicy() {
  return (
    <div className="space-y-6">
      <SectionCard icon={AlertTriangle} title="Política de Cancelamento e Reembolso">
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <p className="font-medium text-warning mb-2">Importante</p>
            <p>As políticas de cancelamento são configuradas individualmente por local. Consulte as regras específicas na página de cada espaço.</p>
          </div>

          <h4 className="font-semibold text-foreground mt-4">Regras Gerais</h4>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Cancelamento antecipado:</strong> Se o cancelamento for feito com antecedência superior ao prazo limite configurado, o reembolso será <strong>integral</strong>, sem aplicação de multa.</li>
            <li><strong>Cancelamento dentro do prazo:</strong> Se o cancelamento for feito dentro do prazo limite (ex: menos de 24 horas antes), será aplicada uma <strong>multa</strong> conforme configuração do local.</li>
            <li><strong>Tipos de multa:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><strong>Percentual:</strong> Um percentual do valor total (ex: 20% do valor da reserva).</li>
                <li><strong>Valor fixo:</strong> Um valor fixo descontado do reembolso (ex: R$ 50,00).</li>
              </ul>
            </li>
          </ul>

          <h4 className="font-semibold text-foreground mt-4">Processamento do Reembolso</h4>
          <ul className="list-disc pl-4 space-y-2">
            <li>Reembolsos são processados automaticamente via <strong>Mercado Pago</strong>.</li>
            <li>O valor é devolvido para a mesma conta que realizou o pagamento PIX.</li>
            <li>O prazo de devolução segue as políticas do Mercado Pago (geralmente até <strong>3 dias úteis</strong>).</li>
          </ul>

          <h4 className="font-semibold text-foreground mt-4">Expiração Automática</h4>
          <ul className="list-disc pl-4 space-y-2">
            <li>Reservas pendentes que <strong>não forem pagas em 30 minutos</strong> expiram automaticamente.</li>
            <li>Nenhuma cobrança é realizada para reservas expiradas.</li>
            <li>Você pode fazer uma nova reserva a qualquer momento após a expiração.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title="Prazos e Horários">
        <div className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-4 space-y-2">
            <li>Os horários de funcionamento e períodos disponíveis variam por local.</li>
            <li>Reservas só podem ser feitas para <strong>datas futuras</strong>.</li>
            <li>Cada período pode ter no máximo <strong>1 reserva ativa</strong> (sem sobreposição).</li>
            <li>O <strong>check-in</strong> pode ser feito apenas no dia da reserva, dentro da janela de tolerância configurada.</li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}

function CheckinProcedure() {
  return (
    <div className="space-y-6">
      <SectionCard icon={UserCheck} title="Procedimento de Check-in">
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="font-medium text-primary mb-2">Visão Geral</p>
            <p>O check-in presencial confirma que o usuário compareceu ao local reservado. Somente reservas com status <strong>"Confirmada"</strong> podem receber check-in.</p>
          </div>

          <h4 className="font-semibold text-foreground">Para o Administrador</h4>
          <ol className="list-decimal pl-4 space-y-3">
            <li>
              <strong>Acesse o módulo Check-in</strong> no painel administrativo.
            </li>
            <li>
              <strong>Localize a reserva:</strong> Use os filtros de data, local e status, ou busque pelo nome do usuário ou código da reserva.
            </li>
            <li>
              <strong>Clique em "Marcar Presença"</strong> na reserva desejada.
            </li>
            <li>
              <strong>Solicite o código:</strong> Peça ao usuário que informe o código de 8 caracteres da reserva (exibido no app).
            </li>
            <li>
              <strong>Digite o código:</strong> Insira o código no campo e clique em "Confirmar Presença".
            </li>
            <li>
              <strong>Validação automática:</strong> O sistema verifica:
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Se o código corresponde à reserva selecionada.</li>
                <li>Se a reserva está com status "Confirmada".</li>
                <li>Se a data é a data da reserva.</li>
                <li>Se não existe check-in duplicado.</li>
              </ul>
            </li>
            <li>
              <strong>Confirmação:</strong> Após a validação, o status muda para <strong>"Presença Confirmada"</strong>.
            </li>
          </ol>

          <h4 className="font-semibold text-foreground mt-4">Para o Usuário</h4>
          <ol className="list-decimal pl-4 space-y-3">
            <li>Acesse <strong>Minhas Reservas</strong> no aplicativo.</li>
            <li>Localize a reserva confirmada para o dia atual.</li>
            <li>Toque em <strong>"Ver Detalhes"</strong> para visualizar o <strong>código de check-in</strong>.</li>
            <li>Informe o código ao administrador no local.</li>
          </ol>

          <h4 className="font-semibold text-foreground mt-4">Configurações</h4>
          <div className="space-y-2">
            <p>No módulo de Check-in, clique em <strong>Configurações</strong> para ajustar:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Tolerância antes:</strong> Quantos minutos antes do horário o check-in pode ser feito (padrão: 15 min).</li>
              <li><strong>Tolerância depois:</strong> Quantos minutos após o horário o check-in ainda é aceito (padrão: 30 min).</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Shield} title="Segurança do Check-in">
        <div className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-4 space-y-2">
            <li>Cada reserva possui um <strong>código único</strong> de 8 caracteres gerado automaticamente.</li>
            <li>O código é validado no servidor — não pode ser forjado ou reutilizado.</li>
            <li>O sistema registra qual <strong>administrador</strong> realizou o check-in para auditoria.</li>
            <li>Check-ins duplicados são bloqueados automaticamente.</li>
            <li>O check-in só é permitido no <strong>dia da reserva</strong>.</li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminDocsContent() {
  return (
    <>
      <PageHeader
        title="Documentação"
        description="Manuais, políticas e procedimentos do sistema"
      />

      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="admin" className="gap-1.5">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Manual do</span> Admin
          </TabsTrigger>
          <TabsTrigger value="user" className="gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Manual do</span> Usuário
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Políticas
          </TabsTrigger>
          <TabsTrigger value="checkin" className="gap-1.5">
            <UserCheck className="w-4 h-4" />
            Check-in
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <AdminManual />
        </TabsContent>

        <TabsContent value="user">
          <UserManual />
        </TabsContent>

        <TabsContent value="policies">
          <RefundPolicy />
        </TabsContent>

        <TabsContent value="checkin">
          <CheckinProcedure />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function AdminDocs() {
  return <AppLayout><AdminDocsContent /></AppLayout>;
}
