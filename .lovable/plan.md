

## Permitir Visualizacao de Locais sem Login

### Objetivo
Tornar as paginas de listagem de locais (`/locations`) e detalhes do local (`/locations/:id`) acessiveis sem autenticacao. Quando o usuario tentar reservar, sera redirecionado para a tela de login/cadastro.

### Mudancas Planejadas

**1. Rotas publicas (App.tsx)**
- Remover o `ProtectedRoute` das rotas `/locations` e `/locations/:id`, tornando-as acessiveis a qualquer visitante.

**2. Layout para visitantes (AppLayout.tsx e Sidebar.tsx)**
- Quando o usuario nao estiver logado, a Sidebar exibira uma versao simplificada:
  - Logo no topo
  - Link para "Locais"
  - Botao "Entrar / Cadastrar" no rodape (em vez do perfil e botao de sair)
- A secao de perfil, links protegidos (Reservas, Notificacoes, Perfil) e admin ficam ocultos para visitantes.

**3. Bloqueio na reserva (LocationDetails.tsx)**
- O botao "Solicitar Reserva" verificara se o usuario esta logado.
- Se nao estiver logado, ao clicar no botao, o usuario sera redirecionado para `/auth` com um parametro de retorno (ex: `/auth?redirect=/locations/ID-DO-LOCAL`), para que apos o login ele volte diretamente a pagina do local.

**4. Redirecionamento pos-login (Auth.tsx)**
- Apos login/cadastro bem-sucedido, verificar se existe um parametro `redirect` na URL.
- Se existir, redirecionar para essa URL em vez da rota padrao `/locations`.

---

### Detalhes Tecnicos

**App.tsx** - Alterar as rotas:
```text
/locations       -> sem ProtectedRoute
/locations/:id   -> sem ProtectedRoute
```

**Sidebar.tsx** - Condicionar renderizacao com base em `user`:
- Se `user` for `null`: mostrar apenas logo + link "Locais" + botao "Entrar"
- Se `user` existir: manter comportamento atual

**LocationDetails.tsx** - No clique de "Solicitar Reserva":
- Se `!user`: redirecionar para `/auth?redirect=/locations/${id}`
- Se `user`: abrir o dialog de confirmacao normalmente

**Auth.tsx** - No `PublicRoute` e apos login:
- Ler `searchParams.get('redirect')`
- Usar esse valor como destino do `Navigate` em vez do `/locations` fixo

**AuthContext.tsx** - Nenhuma alteracao necessaria. O `useAuth` ja retorna `user: null` quando nao autenticado.
