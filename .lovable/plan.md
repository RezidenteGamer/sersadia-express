
# Plano: Sistema de Reembolso com Multa de Cancelamento

## Resumo

Implementar um sistema completo de reembolso configuravel por local, onde:
1. O admin pode definir o valor do reembolso ao cancelar (padrao: valor total)
2. Cada local tem configuracao de multa por cancelamento do usuario (% ou valor fixo)
3. A multa se aplica quando o usuario cancela dentro de X horas antes do horario agendado
4. O reembolso automatico ja desconta a multa

---

## Mudancas no Banco de Dados

Adicionar novas colunas na tabela `locations`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `cancellation_fee_type` | text | Tipo da multa: `percentage` ou `fixed` (padrao: `percentage`) |
| `cancellation_fee_value` | numeric | Valor da multa (ex: 20 para 20% ou 50.00 para R$50) (padrao: 0 = sem multa) |
| `cancellation_deadline_hours` | integer | Horas antes do horario agendado para aplicar multa (padrao: 24) |

---

## Mudancas na Interface

### 1. Formulario de Local (AdminLocations)
Adicionar uma nova secao "Politica de Cancelamento" no formulario de criacao/edicao de local com:
- Tipo de multa (porcentagem ou valor fixo)
- Valor da multa
- Prazo limite em horas (ex: cancelamentos feitos com menos de 24h de antecedencia geram multa)

### 2. Dialog de Cancelamento pelo Admin (AdminReservations)
Quando o admin clicar em "Cancelar" uma reserva:
- Exibir um dialog com campo de valor do reembolso (pre-preenchido com o valor total pago)
- Mostrar informacoes do pagamento original
- Permitir que o admin ajuste o valor para baixo
- Exibir aviso se houver multa configurada e sugerir o valor ja descontado

### 3. Cancelamento pelo Usuario (MyReservations)
Quando o usuario cancelar:
- Verificar se esta dentro do prazo de multa
- Exibir aviso sobre a multa que sera aplicada (se houver)
- Calcular automaticamente o valor de reembolso (total - multa)

---

## Mudancas no Backend

### Edge Function: `refund-payment`
Atualizar para aceitar um parametro `refundAmount` opcional:
- Se fornecido, fazer reembolso parcial via API do Mercado Pago (enviar `amount` no body da requisicao de refund)
- Se nao fornecido, fazer reembolso total (comportamento atual)
- Registrar o valor reembolsado e o valor da multa nos logs

### Hook: `useReservations`
Atualizar `useCancelReservation` para:
- Aceitar parametro de valor de reembolso
- Passar o valor para a edge function `refund-payment`

---

## Detalhes Tecnicos

### Calculo da Multa (frontend)
```text
Se cancellation_fee_value > 0 E horario atual esta dentro do prazo:
  Se tipo = "percentage":
    multa = total_price * (cancellation_fee_value / 100)
  Se tipo = "fixed":
    multa = min(cancellation_fee_value, total_price)
  
  reembolso = total_price - multa
Senao:
  reembolso = total_price (sem multa)
```

### Verificacao do Prazo
```text
prazo = reservation_date + start_time - cancellation_deadline_hours
se agora > prazo: aplica multa
se agora <= prazo: sem multa (reembolso total)
```

### Reembolso Parcial no Mercado Pago
A API do Mercado Pago suporta reembolso parcial enviando o campo `amount` no POST de refund:
```text
POST /v1/payments/{id}/refunds
Body: { "amount": valor_reembolso }
```

---

## Arquivos Afetados

1. **Migracao SQL** - Adicionar colunas na tabela `locations`
2. **`src/pages/admin/AdminLocations.tsx`** - Secao de politica de cancelamento no formulario
3. **`src/pages/admin/AdminReservations.tsx`** - Dialog de cancelamento com campo de valor de reembolso
4. **`src/pages/MyReservations.tsx`** - Aviso de multa no cancelamento pelo usuario
5. **`src/hooks/useReservations.ts`** - Parametro de valor de reembolso no cancelamento
6. **`supabase/functions/refund-payment/index.ts`** - Suporte a reembolso parcial
