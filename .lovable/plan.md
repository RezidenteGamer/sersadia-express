
# Plano de Melhorias para o Ser Sadia Express

Vamos implementar todas as 5 melhorias, organizadas da mais simples para a mais complexa:

---

## 1. Modo Escuro (Dark Mode Toggle)
**Complexidade: Baixa**

O sistema de cores dark já existe no CSS (`index.css` linha 98). Falta apenas um botão para o usuario alternar.

- Adicionar um botão com icone de sol/lua no rodape da Sidebar (ao lado do botao "Sair")
- Usar `localStorage` para persistir a preferencia
- Aplicar/remover a classe `dark` no `<html>` ao clicar
- O admin desktop ja tem um hook similar (`useDesktopTheme.ts`), vamos reutilizar a mesma logica

---

## 2. QR Code na Carteirinha Digital
**Complexidade: Baixa**

- Instalar a biblioteca `qrcode.react` (leve, sem dependencias extras)
- Adicionar um QR Code na parte inferior da carteirinha contendo o `mbrf_id` do socio
- O QR Code sera incluido dentro do `cardRef` para que apareca tambem no download da imagem PNG
- Formato do QR: texto simples com o ID do socio para leitura rapida no check-in

---

## 3. Melhoria da Landing Page
**Complexidade: Media**

Atualizar a pagina inicial (`Index.tsx`) com:
- Secao de depoimentos/beneficios com cards visuais
- Banner de chamada para acao (CTA) mais impactante com gradientes
- Secao "Como funciona" com passos numerados (1. Cadastre-se, 2. Reserve, 3. Aproveite)
- Melhor uso de espacamento, icones e animacoes suaves com Framer Motion (ja instalado)
- Manter os elementos existentes mas com visual mais profissional

---

## 4. Notificacoes em Tempo Real
**Complexidade: Media-Alta**

- Habilitar Supabase Realtime na tabela `notifications` (migration SQL)
- Criar um hook `useRealtimeNotifications` que escuta eventos `INSERT` na tabela de notificacoes
- Ao receber nova notificacao: exibir um toast automatico e atualizar o contador de nao-lidas
- Integrar o listener no Sidebar para mostrar um badge com numero de notificacoes nao lidas ao lado do icone "Notificacoes"
- O listener so sera ativo quando o usuario estiver logado

---

## 5. Progressive Web App (PWA)
**Complexidade: Alta**

- Instalar `vite-plugin-pwa`
- Configurar o plugin no `vite.config.ts` com manifest, service worker e icones
- Adicionar meta tags de PWA no `index.html` (theme-color, apple-touch-icon)
- Criar icones PWA (192x192 e 512x512) na pasta `public`
- Configurar `navigateFallbackDenylist` para excluir rotas de OAuth (`/~oauth`)
- Resultado: usuarios poderao "instalar" o app no celular pelo navegador, com icone na tela inicial, splash screen e funcionamento offline

---

## Detalhes Tecnicos

### Arquivos que serao criados:
- `src/hooks/useThemeToggle.ts` - hook para controle do dark mode
- `src/hooks/useRealtimeNotifications.ts` - hook para notificacoes em tempo real

### Arquivos que serao modificados:
- `src/components/layout/Sidebar.tsx` - toggle dark mode + badge de notificacoes
- `src/pages/MembershipCard.tsx` - QR Code
- `src/pages/Index.tsx` - redesign da landing page
- `src/hooks/useNotifications.ts` - integrar realtime
- `vite.config.ts` - plugin PWA
- `index.html` - meta tags PWA

### Dependencias novas:
- `qrcode.react` - geracao de QR Codes
- `vite-plugin-pwa` - suporte a PWA

### Migration SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Ordem de implementacao:
1. Dark Mode Toggle (rapido, visual imediato)
2. QR Code na Carteirinha (rapido, valor pratico)
3. Landing Page (visual, sem backend)
4. Notificacoes Realtime (backend + frontend)
5. PWA (configuracao mais tecnica)
