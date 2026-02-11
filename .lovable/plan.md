
# Sistema de Suporte via Chat

## Resumo
Criar um sistema completo de suporte onde usuarios podem abrir solicitacoes de atendimento via chat e administradores podem visualizar, aceitar e responder essas solicitacoes diretamente no painel admin.

## Funcionalidades

### Para o Usuario
- Nova opcao "Suporte" no menu lateral com icone de headset
- Pagina dedicada `/support` com lista de tickets anteriores e botao para abrir novo
- Chat em tempo real apos abertura do ticket
- Status visivel do ticket (aguardando, em atendimento, resolvido)
- Possibilidade de reabrir ticket resolvido
- Indicador de "admin digitando" e confirmacao de leitura
- Avaliacao do atendimento apos resolucao (1-5 estrelas)

### Para o Administrador
- Novo modulo "Suporte" no desktop admin com icone de headset
- Tela com 3 abas: Aguardando, Em Atendimento, Resolvidos
- Preview das mensagens do usuario antes de aceitar o ticket
- Botao "Aceitar Atendimento" que vincula o admin ao ticket
- Chat em tempo real com o usuario apos aceitar
- Opcao de encerrar/resolver o ticket
- Adicionar notas internas (visiveis apenas para admins)
- Badge com contador de tickets aguardando na taskbar

### Detalhes Tecnicos

#### 1. Banco de Dados - Novas Tabelas

**support_tickets**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL) - quem abriu
- `admin_id` (uuid, NULL) - admin que aceitou
- `subject` (text, NOT NULL) - assunto do ticket
- `status` (enum: `waiting`, `in_progress`, `resolved`, `closed`)
- `rating` (integer, NULL) - avaliacao 1-5
- `created_at`, `updated_at` (timestamptz)

**support_messages**
- `id` (uuid, PK)
- `ticket_id` (uuid, FK -> support_tickets)
- `sender_id` (uuid, NOT NULL) - quem enviou
- `message` (text, NOT NULL)
- `is_internal` (boolean, default false) - nota interna do admin
- `is_read` (boolean, default false)
- `created_at` (timestamptz)

Enum: `support_ticket_status` com valores `waiting`, `in_progress`, `resolved`, `closed`.

RLS Policies:
- Usuarios veem apenas seus proprios tickets e mensagens (exceto internas)
- Admins veem todos os tickets e todas as mensagens
- Usuarios podem criar tickets e enviar mensagens nos seus tickets
- Admins podem atualizar tickets e enviar mensagens

Realtime habilitado para ambas as tabelas.

#### 2. Nova Permissao Admin
- Adicionar `manage_support` ao enum `admin_permission`

#### 3. Novos Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Support.tsx` | Pagina do usuario com lista de tickets + chat |
| `src/pages/admin/AdminSupport.tsx` | Conteudo do modulo admin |
| `src/hooks/useSupport.ts` | Hooks para tickets e mensagens com realtime |
| `src/components/support/SupportChat.tsx` | Componente de chat reutilizavel |
| `src/components/support/TicketList.tsx` | Lista de tickets |
| `src/components/support/TicketStatusBadge.tsx` | Badge de status |
| `src/components/support/RatingDialog.tsx` | Dialog de avaliacao |

#### 4. Alteracoes em Arquivos Existentes

- **Sidebar.tsx**: Adicionar item "Suporte" com icone `Headset` no menu do usuario
- **App.tsx**: Adicionar rota `/support` protegida
- **AdminDesktop.tsx**: Adicionar app "Suporte" na lista `ALL_APPS`
- **AdminMobileView.tsx**: Incluir modulo suporte na view mobile

#### 5. Fluxo

```text
Usuario abre ticket -> Status: "waiting"
                    -> Admin ve na aba "Aguardando" com preview
                    -> Admin clica "Aceitar"
                    -> Status: "in_progress", admin_id preenchido
                    -> Chat em tempo real bidirecional
                    -> Admin clica "Resolver"
                    -> Status: "resolved"
                    -> Usuario pode avaliar (1-5 estrelas)
```

#### 6. Realtime
- `support_messages` com realtime para atualizacao instantanea do chat
- `support_tickets` com realtime para atualizar contadores e status
