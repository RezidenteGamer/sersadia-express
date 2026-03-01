
# Carteirinha Digital Offline

## Objetivo
Permitir que a tela da Carteirinha Digital (/carteirinha) funcione sem internet no APK nativo, desde que o usuario tenha feito login nas ultimas 24 horas. Os dados do socio, perfil e dependentes serao salvos em localStorage e servidos como fallback quando nao houver conexao.

## Como funciona

Toda vez que o usuario abre a carteirinha **com internet**, os dados sao buscados normalmente do banco e uma copia e salva no localStorage junto com um timestamp. Quando abre **sem internet** (ou a requisicao falha), o app verifica se existe cache local com menos de 24h. Se existir, renderiza a carteirinha com esses dados. Se nao existir ou estiver expirado, mostra mensagem pedindo que se conecte.

A foto do socio tambem sera cacheada: convertida para base64 e salva junto no localStorage, para que apareca mesmo offline.

## Arquivos a criar

### 1. `src/lib/offlineCache.ts`
Modulo utilitario com funcoes:
- `saveCardCache(data)` -- salva dados + timestamp em localStorage com chave `membership-card-cache`
- `getCardCache()` -- le do localStorage, retorna `null` se expirado (>24h) ou inexistente
- `cacheAvatarAsBase64(url)` -- faz fetch da imagem, converte para base64 data URL e salva em localStorage
- `getCachedAvatar()` -- retorna base64 do avatar ou null
- `isCacheValid()` -- verifica se cache existe e tem menos de 24h

### 2. `src/hooks/useOfflineMembershipCard.ts`
Hook que encapsula a logica offline:
- Recebe `membership`, `profile`, `dependents` como parametros
- Quando os dados online estao disponiveis, salva no cache (incluindo avatar em base64)
- Quando os dados online falham/estao ausentes, tenta carregar do cache
- Retorna `{ cardData, isOffline, cacheAge }` onde `cardData` contem membership + profile + dependents unificados

## Arquivos a modificar

### 3. `src/pages/MembershipCard.tsx`
- Importar e usar `useOfflineMembershipCard`
- Passar os dados de membership, profile e dependents para o hook
- Quando offline, usar os dados do cache em vez dos dados da query
- Mostrar um banner discreto "Modo offline -- dados de X horas atras" quando estiver usando cache
- Esconder funcionalidades que precisam de internet (upload de foto, gerenciamento de dependentes)
- Usar avatar cacheado (base64) quando offline

### 4. `src/components/membership/DependentsCardBack.tsx`
- Aceitar prop opcional `offlineDependents` para receber dependentes do cache
- Quando offline, usar esses dados em vez de chamar `useDependents`

### 5. `src/components/membership/DependentsList.tsx`
- Aceitar prop `isOffline` para esconder botoes de adicionar/remover quando offline

## Detalhes tecnicos

**Estrutura do cache no localStorage:**
```text
Chave: "membership-card-cache"
Valor: JSON com {
  membership: { id, name, mbrf_id, ... },
  profile: { full_name, email, avatar_url, mbrf_id },
  dependents: [{ id, name, relationship, ... }],
  cachedAt: timestamp ISO,
  avatarBase64: "data:image/..." ou null
}
```

**Deteccao de offline:**
- Verificar `navigator.onLine` como primeira checagem
- Usar falha nas queries do React Query (error state) como confirmacao
- Ambos os sinais juntos determinam o modo offline

**Limite de 24h:**
- Compara `Date.now()` com o `cachedAt` do cache
- Se diferenca > 24h, descarta o cache e pede reconexao

**Avatar em base64:**
- Ao salvar cache, faz fetch da URL da foto e converte via canvas/FileReader para data URL
- Isso garante que a foto aparece mesmo sem internet
- Tamanho limitado (imagens ja sao comprimidas no upload)

**Experiencia do usuario offline:**
- Banner amarelo no topo: "Voce esta offline. Mostrando dados salvos de [horario]."
- Botoes de upload de foto e gerenciamento de dependentes ficam desabilitados
- Download da carteirinha como imagem continua funcionando (usa dados ja renderizados)
