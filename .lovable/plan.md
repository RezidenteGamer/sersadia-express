

# Redesign do Modulo de Check-in

## Problemas atuais
- Tudo misturado em uma lista so (confirmadas e finalizadas juntas)
- Filtro por data fixa (um dia por vez), sem paginacao
- Busca basica, sem filtro combinado por local + nome + codigo
- Stats mostram apenas o dia selecionado
- Nao mostra reservas ja finalizadas (cancelled, expired, etc.)

## Proposta de redesign

### Layout com Tabs
Duas abas principais:
- **Aguardando Check-in** -- reservas com status `confirmed` (acao principal do admin)
- **Finalizadas** -- reservas com status `presence_confirmed`, `cancelled_by_user`, `cancelled_by_admin`, `expired`, `rejected`

### Filtros melhorados
Remover o filtro de data fixa. Em vez disso:
- **Barra de busca unificada**: pesquisa por nome do usuario, codigo da reserva, ou nome do local
- **Filtro por local**: dropdown com os locais disponiveis
- **Filtro por periodo (date range)**: dois campos de data (de/ate), opcional. Se vazio, mostra tudo
- **Na aba "Finalizadas"**: filtro adicional por tipo de finalizacao (presenca confirmada, cancelada, expirada)

### Paginacao
- 14 reservas por pagina
- Botoes "Anterior / Proxima" com indicador de pagina
- Contagem total de resultados

### Cards redesenhados
Melhorar a hierarquia visual:
- **Aba "Aguardando"**: destaque no botao "Marcar Presenca", mostrar horario restante ate o evento
- **Aba "Finalizadas"**: mostrar data completa, quem fez o checkin, horario do checkin

### Stats contextuais
Os cards de estatisticas mudam conforme a aba:
- **Aguardando**: Total aguardando, Proximos 1h, Atrasados (horario ja passou)
- **Finalizadas**: Total presencas, Taxa de presenca, Cancelamentos

## Arquivos a modificar

### `src/pages/admin/AdminCheckin.tsx`
Reescrever com:
- Tabs (Aguardando / Finalizadas)
- Novo layout de filtros com busca, local, date range
- Paginacao client-side (slice dos resultados filtrados, 14 por pagina)
- Stats contextuais por aba
- Cards com melhor hierarquia visual

### `src/hooks/useReservations.ts`
- Adicionar `useAllReservationsNoPagination()` ou ajustar `useAllReservations` para aceitar filtros de date range (startDate, endDate) em vez de data unica
- Remover limite de data fixa para trazer range de datas

### `src/hooks/useCheckin.ts`
- Sem mudancas estruturais, apenas manter compatibilidade

## Resumo visual

```text
┌─────────────────────────────────────────────┐
│  Controle de Presenca          [Config]      │
├─────────────────────────────────────────────┤
│  [Aguardando Check-in]  [Finalizadas]        │
├─────────────────────────────────────────────┤
│  🔍 Buscar nome/codigo/local                 │
│  [Local ▼]  [De: ___]  [Ate: ___]  [Limpar] │
├─────────────────────────────────────────────┤
│  📊 Total: 28  │ Proxima 1h: 5  │ Atras: 2  │
├─────────────────────────────────────────────┤
│  ┌─ Card ──────────────────────────────┐     │
│  │ ABC123  ● Confirmada                │     │
│  │ 👤 Joao Silva                       │     │
│  │ 📍 Salao Nobre  🕐 14:00 - 16:00   │     │
│  │ 📅 15/03/2026                       │     │
│  │              [Marcar Presenca ✓]    │     │
│  └─────────────────────────────────────┘     │
│  ... (14 por pagina)                         │
├─────────────────────────────────────────────┤
│  ◀ Anterior   Pagina 1 de 3   Proxima ▶     │
└─────────────────────────────────────────────┘
```

