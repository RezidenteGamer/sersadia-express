
# Preparar o APK com Todos os Recursos Nativos

## Resumo
Implementar todos os plugins nativos do Capacitor que nao podem ser adicionados depois via deploy web. Isso inclui controle da barra de status, deteccao de rede, comportamento do teclado, compartilhamento nativo, navegador externo, safe areas e refresh automatico ao voltar ao app.

## O que ja esta pronto
- Splash Screen configurada
- Botao voltar do Android com dialogo de saida
- Carteirinha digital com modo offline (cache 24h)

## O que sera implementado

### 1. Safe Area (index.html + index.css)
Adicionar `viewport-fit=cover` na meta viewport do `index.html` e CSS com `env(safe-area-inset-*)` no `index.css` para garantir que o conteudo nao fique atras do notch ou barra de navegacao por gestos.

### 2. Configurar capacitor.config.ts
Adicionar configuracoes dos plugins StatusBar e Keyboard:
- StatusBar: cor verde da marca (#16a34a), estilo claro
- Keyboard: modo de redimensionamento para evitar layout quebrado em formularios

### 3. Criar src/lib/native.ts
Modulo utilitario com funcoes que usam import dinamico (funciona tanto no app nativo quanto no browser):
- `configureStatusBar()` -- aplica cor e estilo da barra de status
- `shareContent(title, text, url?)` -- abre menu de compartilhamento nativo do Android
- `openExternalUrl(url)` -- abre link no navegador nativo (fora da WebView)

### 4. Criar src/hooks/useNetworkStatus.ts
Hook que detecta quando o usuario perde conexao e mostra um toast/banner:
- Ouve eventos `online`/`offline` do navegador
- No app nativo, usa `@capacitor/network` para deteccao mais precisa
- Mostra toast "Voce esta sem internet" ao ficar offline

### 5. Criar src/hooks/useAppResume.ts
Hook que invalida queries do React Query quando o app volta do background:
- Usa evento `appStateChange` do `@capacitor/app` (ja instalado)
- Ao retornar ao foreground, invalida todas as queries para buscar dados frescos

### 6. Atualizar src/main.tsx
Chamar `configureStatusBar()` na inicializacao do app para aplicar a cor da barra de status imediatamente ao abrir.

### 7. Atualizar src/App.tsx
Integrar os novos hooks `useNetworkStatus` e `useAppResume` no componente `AppRoutes`.

### 8. Adicionar botao de compartilhar na carteirinha
No `MembershipCard.tsx`, adicionar um botao "Compartilhar" ao lado do "Baixar Carteirinha" que usa a funcao `shareContent` para abrir o menu nativo de compartilhamento.

---

## Detalhes tecnicos

**Dependencias novas (npm install):**
```
@capacitor/status-bar
@capacitor/keyboard
@capacitor/network
@capacitor/share
@capacitor/browser
```

**Arquivos a criar:**
- `src/lib/native.ts`
- `src/hooks/useNetworkStatus.ts`
- `src/hooks/useAppResume.ts`

**Arquivos a modificar:**
- `index.html` -- adicionar `viewport-fit=cover`
- `src/index.css` -- adicionar padding com safe-area-inset
- `capacitor.config.ts` -- configs de StatusBar e Keyboard
- `src/main.tsx` -- inicializar StatusBar
- `src/App.tsx` -- usar hooks de network e resume
- `src/pages/MembershipCard.tsx` -- botao compartilhar

**Todas as funcoes nativas usam import dinamico** (`await import(...)`) com try/catch, entao funcionam no browser sem erro -- so ativam no app nativo.

**Apos aprovacao**, voce precisara rodar no projeto local:
```bash
npm install @capacitor/status-bar @capacitor/keyboard @capacitor/network @capacitor/share @capacitor/browser
npx cap sync
```
