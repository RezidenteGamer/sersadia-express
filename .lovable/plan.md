

## Correções no Menu Mobile — Bottom Nav

### Problemas identificados

1. **Badge de notificações desalinhado**: O badge de contagem no ícone do sino empurra o ícone para cima porque o `div` container com `relative` + badge absoluto não mantém altura consistente com os outros ícones.

2. **Menu "Mais" não clicável**: O overlay (z-30) cobre o painel slide-up (z-35). O valor `z-35` não é um z-index padrão do Tailwind — ele não existe por default, então o painel fica **atrás** do overlay, tornando os botões não clicáveis.

### Correções

**Arquivo: `src/components/layout/Sidebar.tsx`**

1. **Badge de notificações** (linhas 248-255): Garantir que o container do ícone tenha altura fixa para não ser empurrado pelo badge. Adicionar `h-[22px]` ao `div.relative` que envolve o ícone, para que o badge não afete o fluxo de layout.

2. **Z-index do menu slide-up** (linha 280): Trocar `z-35` por `z-50` (valor válido do Tailwind). O overlay na linha 279 deve ser `z-40` (ou manter `z-30` e o painel em `z-[45]`). A solução mais limpa:
   - Overlay: `z-[60]` 
   - Painel slide-up: `z-[70]`
   - Isso garante que ambos fiquem acima do bottom nav (`z-40`) e que o painel fique acima do overlay.

### Resumo das mudanças
- 1 arquivo modificado: `src/components/layout/Sidebar.tsx`
- ~4 linhas alteradas
- Sem mudanças de lógica, apenas CSS/z-index

