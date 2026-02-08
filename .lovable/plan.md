
## Admin Desktop -- Ambiente de Trabalho Administrativo

Transformar a area administrativa em um **desktop estilo sistema operacional**, onde cada funcionalidade admin e um "aplicativo" que abre em janelas flutuantes dentro de uma unica tela.

### Como vai funcionar para o usuario

1. No menu lateral, um unico botao **"Administracao"** substitui os 8 itens admin atuais
2. Ao clicar, abre uma tela de **area de trabalho** com fundo sutil e icones organizados em grade
3. Cada icone representa um modulo: Locais, Reservas, Socios, Usuarios, Pagamentos, Check-in, Banners, Relatorios, e o Dashboard
4. Ao clicar em um icone, abre uma **janela flutuante** dentro da mesma pagina:
   - Barra de titulo com nome do app, botoes de minimizar, maximizar e fechar
   - Conteudo da funcionalidade admin renderizado dentro da janela
   - Janela pode ser **arrastada** pela barra de titulo
   - Janela pode ser **maximizada** (tela cheia dentro do desktop) ou restaurada
   - Janela pode ser **minimizada** (fica na barra de tarefas)
5. Uma **barra de tarefas** na parte inferior mostra as janelas abertas/minimizadas (como a taskbar do Windows)
6. Multiplas janelas podem ficar abertas ao mesmo tempo

### Detalhes Tecnicos

**1. Simplificar Sidebar (`src/components/layout/Sidebar.tsx`)**
- Remover os 8 itens de `adminNavItems`
- Adicionar um unico item "Administracao" com icone `Monitor` apontando para `/admin`

**2. Criar componente DesktopWindow (`src/components/admin/DesktopWindow.tsx`)**
- Janela flutuante com:
  - Barra de titulo arrastavel (usando mouse events para drag)
  - Botoes: minimizar, maximizar/restaurar, fechar
  - Estado de posicao (top, left) controlado por estado React
  - Estado maximizado (ocupa 100% do container)
  - z-index dinamico para trazer janela ao foco ao clicar
  - Conteudo renderizado como children

**3. Criar componente DesktopTaskbar (`src/components/admin/DesktopTaskbar.tsx`)**
- Barra fixa na parte inferior do desktop
- Mostra botoes para cada janela aberta (com icone e titulo)
- Clicar em janela minimizada restaura ela; clicar em janela ativa minimiza
- Relogio no canto direito (opcional, para o visual de OS)

**4. Criar componente DesktopIcon (`src/components/admin/DesktopIcon.tsx`)**
- Icone de aplicativo com label abaixo
- Duplo clique ou clique unico abre a janela correspondente
- Visual similar a icones de area de trabalho

**5. Criar gerenciador de estado (`src/components/admin/useDesktopManager.ts`)**
- Hook customizado para gerenciar:
  - Lista de janelas abertas (id, titulo, icone, componente, estado)
  - Estado de cada janela: aberta, minimizada, maximizada, posicao, z-index
  - Funcoes: openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow

**6. Refatorar AdminDashboard (`src/pages/admin/AdminDashboard.tsx`)**
- Transformar em tela de desktop completa (ocupa toda a area de conteudo)
- Fundo com gradiente sutil ou pattern
- Grade de icones dos apps:
  - Dashboard (stats e resumo)
  - Locais
  - Reservas
  - Socios
  - Usuarios
  - Pagamentos
  - Check-in
  - Banners
  - Relatorios
- Cada icone ao clicar chama `openWindow()` do hook, que renderiza o conteudo da pagina admin correspondente dentro de uma `DesktopWindow`
- `DesktopTaskbar` fixo na parte inferior

**7. Adaptar paginas admin para renderizacao inline**
- Extrair o conteudo de cada pagina admin (AdminLocations, AdminReservations, etc.) em componentes separados que podem ser renderizados tanto standalone (via rota) quanto dentro de uma DesktopWindow
- Remover o wrapper `AppLayout` quando renderizado dentro do desktop
- Manter as rotas individuais funcionando como fallback

**8. Arquivos a criar:**
- `src/components/admin/DesktopWindow.tsx`
- `src/components/admin/DesktopTaskbar.tsx`
- `src/components/admin/DesktopIcon.tsx`
- `src/components/admin/useDesktopManager.ts`
- `src/components/admin/AdminDesktop.tsx` (container principal do desktop)

**9. Arquivos a modificar:**
- `src/components/layout/Sidebar.tsx` -- simplificar menu admin
- `src/pages/admin/AdminDashboard.tsx` -- usar o AdminDesktop
- `src/pages/admin/AdminLocations.tsx` -- extrair conteudo
- `src/pages/admin/AdminReservations.tsx` -- extrair conteudo
- `src/pages/admin/AdminUsers.tsx` -- extrair conteudo
- `src/pages/admin/AdminPayments.tsx` -- extrair conteudo
- `src/pages/admin/AdminCheckin.tsx` -- extrair conteudo
- `src/pages/admin/AdminReports.tsx` -- extrair conteudo
- `src/pages/admin/AdminMembers.tsx` -- extrair conteudo
- `src/pages/admin/AdminBanners.tsx` -- extrair conteudo

Nenhuma mudanca no banco de dados e necessaria.
