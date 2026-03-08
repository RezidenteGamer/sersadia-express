

# Modulo de Relatórios Financeiros e Prestação de Contas

## Visão Geral

Criar uma nova página `AdminFinancialReports` com dois modos principais:
1. **Relatórios Prontos** - Templates pré-definidos de prestação de contas financeira
2. **Montador Personalizado** - Interface drag-and-drop para construir relatórios customizados

A página atual `AdminReports` continua focada em relatórios operacionais (reservas, check-in). O novo módulo é exclusivamente financeiro.

## Estrutura

### Relatórios Prontos (Templates)

Cada template é filtrável por **período** (date range), **local**, **método de pagamento** e **status**:

1. **Resumo Financeiro Geral** - Cards com: receita total, receita recebida, a receber, inadimplência, ticket médio. Gráfico de receita por mês.
2. **Receita por Local** - Tabela e gráfico de barras com faturamento por local, comparando recebido vs pendente.
3. **Receita por Método de Pagamento** - Pie chart mostrando distribuição PIX, dinheiro, cartão, etc.
4. **Relatório de Inadimplência** - Lista de pagamentos pendentes com nome do usuário, valor, data da reserva. Totalizadores.
5. **Fluxo de Caixa Diário** - Line chart de entradas por dia no período selecionado.
6. **Relatório de Estornos** - Pagamentos estornados com valores e motivos (usa `refund-payment` edge function data).

### Montador de Relatório Personalizado

Interface onde o admin seleciona:
- **Métricas** (checkboxes): Receita total, Qtd pagamentos, Ticket médio, Inadimplência, Receita por local, Receita por método, Fluxo diário
- **Filtros**: Período, Local, Método de pagamento, Status (pago/pendente)
- **Visualização**: Tabela, Gráfico de barras, Gráfico de linha, Gráfico de pizza
- **Agrupamento**: Por dia, semana, mês, local, método

O relatório gerado pode ser **exportado como CSV** (usando `html-to-image` já instalado para screenshot ou gerando CSV puro).

### Exportação

- Botão "Exportar CSV" em todos os relatórios (gera download do arquivo)
- Botão "Imprimir / PDF" usando `window.print()` com CSS de impressão

## Arquivos a Criar/Modificar

### Criar: `src/pages/admin/AdminFinancialReports.tsx`
- Página principal com tabs: "Relatórios Prontos" e "Montador Personalizado"
- Componentes internos para cada template de relatório
- Lógica de filtros compartilhada
- Montador com seleção de métricas + preview

### Criar: `src/hooks/useFinancialReports.ts`
- Hook com queries para cada tipo de relatório financeiro
- Busca dados de `payments` + `reservations` + `locations` + `profiles`
- Funções utilitárias de agrupamento e cálculo

### Criar: `src/lib/exportReport.ts`
- Função `exportToCSV(data, columns, filename)` para gerar download CSV

### Modificar: `src/App.tsx`
- Adicionar rota `/admin/financial-reports`

### Modificar: `src/components/admin/AdminDesktop.tsx`
- Adicionar app "Financeiro" na lista de apps do desktop admin

### Modificar: `src/components/admin/AdminMobileView.tsx`
- Adicionar item de menu "Financeiro" na view mobile

## Layout Visual

```text
┌──────────────────────────────────────────────────┐
│  Relatórios Financeiros          [Exportar CSV]  │
├──────────────────────────────────────────────────┤
│  [Relatórios Prontos]  [Montador Personalizado]  │
├──────────────────────────────────────────────────┤
│  Filtros:                                        │
│  [De: ___] [Até: ___] [Local ▼] [Método ▼]      │
├──────────────────────────────────────────────────┤
│  📊 Cards de Resumo                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │Receita │ │Recebido│ │Pendente│ │Ticket  │    │
│  │Total   │ │        │ │        │ │Médio   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘    │
├──────────────────────────────────────────────────┤
│  [Resumo] [Por Local] [Por Método] [Inadimp.]   │
│  [Fluxo Caixa] [Estornos]                       │
├──────────────────────────────────────────────────┤
│  Gráficos + Tabelas do relatório selecionado     │
└──────────────────────────────────────────────────┘
```

```text
Montador Personalizado:
┌──────────────────────────────────────────────────┐
│  Métricas (selecione):                           │
│  ☑ Receita total  ☑ Qtd pagamentos               │
│  ☐ Ticket médio   ☑ Receita por local            │
│  ☐ Inadimplência  ☐ Fluxo diário                │
├──────────────────────────────────────────────────┤
│  Agrupar por: [Mês ▼]  Visualizar: [Tabela ▼]   │
├──────────────────────────────────────────────────┤
│  [Gerar Relatório]                               │
├──────────────────────────────────────────────────┤
│  Preview do relatório gerado                     │
└──────────────────────────────────────────────────┘
```

## Dados Utilizados

Todas as queries usam as tabelas existentes (`payments`, `reservations`, `locations`, `profiles`). Não é necessário criar novas tabelas ou migrations.

