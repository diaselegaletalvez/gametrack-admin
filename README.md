# GameTrack Admin

Painel **interno** pra eu (Gabriel / admin) gerenciar o GameTrack durante o
desenvolvimento e os testes. **Não vai pra App Store / Play Store.** É um
projeto Expo separado que roda só no navegador, conectado ao MESMO Supabase
do app principal.

---

## O que ele faz

- Login Supabase + checa `profiles.is_admin = true`. Se não for admin, bloqueia tudo.
- **Gerar Códigos**: cria códigos de ativação em `activation_codes` (escolhe plano + quantidade + dias + prefixo).
- **Usuários**: lista todos do `auth.users` com seu plano ativo, troca plano pra teste.
- **Catálogo**: CRUD de `catalogo_jogos` (com capa).
- **Reset de Teste**: zera dados de teste de UMA conta (jogos, sessões, conquistas, pets, missões, compras) com confirmação dupla.
- **Pegar Ovos / Pets** e **Criar Contas Teste**: placeholders "Em breve".

---

## Setup (uma vez só)

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Cole no `.env` as MESMAS chaves do `.env` do app principal (`~/projetos/gametrack/.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Migração SQL

Abre o [SQL Editor do Supabase](https://supabase.com/dashboard) e cola o conteúdo de:

```
supabase/sql/001_painel_admin.sql
```

Isso cria:
- `is_current_user_admin()` (helper)
- RLS pra admin ler `activation_codes` e escrever em `catalogo_jogos`
- RPCs `admin_list_users`, `admin_set_user_plan`, `admin_create_codes`, `admin_reset_user_data`

**Pré-requisitos no banco** (você já rodou no app principal): `profiles.is_admin`, `activate_plan_for_user`, `gen_activation_code`.

### 3. Marcar sua conta como admin

(Já feito na migração 007 do app, mas pra confirmar):

```sql
update public.profiles
  set is_admin = true
  where user_id = (select id from auth.users where email = 'gd665742@gmail.com');
```

---

## Rodar localmente

```bash
npm install         # só na primeira vez
npm run web         # abre no http://localhost:8081
```

Em seguida, abre o navegador na URL que o Expo imprimir e loga com sua conta admin.

---

## Publicar (separado do app principal)

Como este projeto **nunca** vai pra loja, a publicação é simples — build estático e hospeda em qualquer lugar:

```bash
# Gera o site estático em ./dist
npx expo export -p web

# Servir localmente pra conferir
npx serve dist
```

Hospedagem sugerida (qualquer uma serve):

- **Vercel**: `vercel --prod` (do diretório raiz). Build command: `npx expo export -p web`. Output: `dist`.
- **Netlify**: arrasta a pasta `dist` no painel.
- **Cloudflare Pages**: idem.
- **GitHub Pages**: ok, mas tem que mexer no base path.

> ⚠️ **NUNCA** suba este painel pra App Store ou Play Store. Ele é ferramenta interna.
> Também não exponha a URL pública pra ninguém — qualquer pessoa que tente entrar
> sem ser admin é bloqueada, mas é educação não anunciar.

---

## Por que NÃO uso service_role

Toda escrita sensível roda via **RPC `security definer`** que checa
`is_current_user_admin()` antes. Isso significa:

- A anon key é tudo que precisa.
- Se um dia eu quiser deixar outra pessoa (ex: moderador) acessar parcial, é só
  granularidade na RPC.
- Nada que dê acesso de service_role fica no cliente — se algum dia precisar (ex:
  criar usuário programaticamente), criar uma **Edge Function** no projeto
  Supabase, não jogar a key no front.

---

## Estrutura

```
gametrack-admin/
├── app/
│   ├── _layout.tsx          # AuthProvider + Stack
│   ├── index.tsx            # Redirect (loga? vai pro admin)
│   ├── login.tsx
│   └── (admin)/             # Gate: bloqueia não-admin
│       ├── _layout.tsx
│       ├── codigos.tsx
│       ├── usuarios.tsx
│       ├── catalogo.tsx
│       ├── reset.tsx
│       ├── ovos.tsx         # placeholder
│       └── contas.tsx       # placeholder
├── components/
│   ├── sidebar.tsx
│   ├── page-shell.tsx
│   └── ui.tsx               # Card/Button/Field/Pill/Alert
├── constants/
│   ├── theme.ts
│   └── plans.ts
├── lib/
│   ├── supabase.ts
│   ├── auth.tsx
│   └── types.ts
└── supabase/
    └── sql/
        └── 001_painel_admin.sql
```
