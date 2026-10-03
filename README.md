# Diário dos BNs

Site responsivo em português para estudar Física com cenas Blender, laboratório 3D e materiais de apoio. O projeto inclui cadastro e login Supabase, áreas separadas de aluno, professor e administrador, esquema PostgreSQL com RLS e uma biblioteca inicial de animações.

## Publicar no GitHub Pages

O endereço `https://iwally1197.github.io/DiarioDosBNs/` é hospedado pelo GitHub Pages. A versão atual foi preparada para publicação estática: os links e recursos respeitam a pasta `/DiarioDosBNs/`, as páginas de conta têm rotas em pastas e `supabase-config.js` contém somente a chave **publicável** do Supabase. Essa chave é visível no navegador por projeto; nunca coloque aqui uma chave `sb_secret_...`, `service_role` ou senha de banco.

No GitHub, envie o conteúdo desta pasta diretamente para a raiz do repositório `DiarioDosBNs` (incluindo `index.html`, `styles.css`, `assets/`, `src/`, `downloads/`, `supabase-config.js` e `.nojekyll`). Depois, em **Settings → Pages**, escolha publicar a partir da branch principal e da pasta raiz. Não envie `.env.local`.

No Supabase, em **Authentication → URL Configuration**, use `https://iwally1197.github.io/DiarioDosBNs/` como **Site URL** e inclua nas URLs permitidas:

```text
https://iwally1197.github.io/DiarioDosBNs/auth/callback/
https://iwally1197.github.io/DiarioDosBNs/recuperar-senha/?mode=update
```

Cadastros e áreas autenticadas só funcionarão após executar as migrações e o seed descritos abaixo. GitHub Pages não executa `server.mjs`; para uso local, esse servidor continua disponível. A versão estática não usa chave secreta no navegador.

## Executar localmente

Requer Node.js 20 ou superior. No PowerShell, dentro desta pasta, rode:

```powershell
node server.mjs
```

Depois abra <http://127.0.0.1:4173>. Também é possível usar `npm start` quando o npm estiver instalado. Não abra as páginas pelo endereço `file://`: o servidor local fornece as rotas de conta e a configuração pública do Supabase.

## Configuração do Supabase

O navegador lê a configuração pública de `supabase-config.js`:

```js
export const supabaseConfig = Object.freeze({
  url: 'https://SEU-PROJETO.supabase.co',
  publishableKey: 'sb_publishable_SUA_CHAVE_PUBLICAVEL',
  configured: true
});
```

Substitua os exemplos pelos valores de **Connect** ou **Settings → API Keys** do Supabase. A chave `sb_publishable_...` é pública e pode ser enviada ao navegador; ela não substitui as políticas do banco. Nunca coloque `service_role`, `secret key` ou senha de banco neste arquivo ou em um repositório público. O servidor Node local pode usar `.env.local` para suas configurações, mas o GitHub Pages não lê arquivos `.env`.

No Supabase Dashboard:

1. Em **Authentication → URL Configuration**, defina **Site URL** como `http://127.0.0.1:4173` para desenvolvimento.
2. Adicione `http://127.0.0.1:4173/auth/callback` e `http://127.0.0.1:4173/recuperar-senha?mode=update` à lista de **Redirect URLs**.
3. Ative a confirmação de e-mail. Para uso público, configure SMTP próprio; o serviço de e-mail padrão do Supabase é limitado e não deve ser tratado como entrega garantida.
4. Em produção, troque o Site URL e os redirecionamentos pelo domínio HTTPS publicado. Não mantenha um redirect amplo com curingas em produção.

A documentação oficial explica a lista de URLs de redirecionamento e o uso de chaves publicáveis no cliente: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) e [API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## Criar as tabelas e permissões

No **SQL Editor** do projeto Supabase, execute nesta ordem:

1. `supabase/migrations/20261003120000_diario_bns_core.sql`
2. `supabase/seed.sql` para cadastrar os 17 tópicos e 82 animações do catálogo.
3. No Dashboard de Storage, crie um bucket chamado `downloads` com a opção **Public bucket desativada**.
4. Execute `supabase/migrations/20261003121000_private_download_storage.sql`.

A migração principal separa perfil público de credenciais do Auth, cria UUIDs e relacionamentos, habilita RLS, revoga privilégios amplos e concede apenas os acessos usados pelo site. O seed é repetível: animações com slug já existente são ignoradas. Os arquivos `.blend` que já estão em `downloads/` são materiais gerais servidos pelo site. Materiais exclusivos para professores devem ser enviados pelo painel de administrador ao bucket privado; não coloque esses arquivos em `downloads/`.

O Supabase exige tanto grants quanto políticas RLS; uma política não concede por si só permissão à tabela. Consulte [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) e [controle de acesso do Storage](https://supabase.com/docs/guides/storage/security/access-control).

## Criar o primeiro administrador

Administrador não existe no formulário público. Primeiro, faça cadastro de uma conta usando seu próprio e-mail, confirme o e-mail e localize o UUID da conta em **Authentication → Users**. Abra `supabase/bootstrap-admin.sql.example`, troque `SEU_UUID_CONFIRMADO` pelo UUID real nas duas ocorrências e execute no **SQL Editor**. Faça isso apenas com uma conta que você controla. A migração não concede ao navegador permissão para alterar a coluna `role`; o painel pode aprovar ou bloquear status, mas não promove usuários a administrador.

Cadastros de professor entram como `pending`. Depois de revisar a conta, o administrador pode aprová-la pelo painel. Até lá, políticas do banco bloqueiam downloads e funções docentes mesmo que alguém digite `/professor` diretamente.

## Páginas e recursos

- `/` e `index.html`: apresentação, busca e navegação pelos assuntos de Física.
- `topico.html?topico=cinematica`: explicações e projetos `.blend` por tópico.
- `animacao.html`: descrição e arquivo de cada animação; a cena é aberta no Blender, não reproduzida pelo YouTube.
- `downloads.html`: catálogo público com busca e 82 projetos Blender.
- `blender.html`: tutorial de navegação da viewport, seleção e transformação de objetos, `Shift+S`, modelagem, materiais, luz, animação e renderização; substitua os espaços de vídeo pelas URLs reais do YouTube.
- `laboratorio.html`, `professores.html` e `pesquisa.html`: laboratório interativo, materiais pedagógicos e apresentação do projeto.
- `/cadastro`, `/login`, `/recuperar-senha`, `/perfil`, `/aluno`, `/professor` e `/admin`: conta e áreas protegidas. O servidor mapeia esses caminhos para a aplicação web.

Os arquivos `.blend` públicos continuam acessíveis por seus endereços em `downloads/`. A autorização de arquivos exclusivos usa o bucket privado e links temporários; pela natureza de um download, qualquer pessoa autorizada ainda pode salvar uma cópia local.

## Sessões e limites de segurança

O cliente oficial do Supabase usa fluxo PKCE, renovação automática e persistência da sessão, sem guardar senhas nas tabelas do site. Neste aplicativo de navegador, o SDK mantém tokens no armazenamento do navegador para sobreviver à recarga. Como qualquer SPA, scripts executados na origem podem acessar esse armazenamento; proteja a origem contra XSS e sirva o site apenas por HTTPS em produção. Para exigir tokens inacessíveis ao JavaScript, hospede a autenticação por um backend/BFF com cookies `HttpOnly`, `Secure` e `SameSite` e revise a arquitetura antes do lançamento.

O `server.mjs` é um servidor simples para desenvolvimento/preview, não um serviço de hospedagem de produção. Em produção, use um host HTTPS com suporte às rotas, injete as mesmas duas variáveis públicas no ambiente de execução e configure uma origem autorizada no Supabase. O site não inclui chave `service_role`.

Os termos e a política de privacidade são minutas com campos para preencher. Como o projeto pode atender estudantes menores de idade, confirme as práticas de consentimento, privacidade, retenção e contato com o responsável antes de abrir o cadastro. Os materiais devem ser adaptados às necessidades de cada estudante; o site não promete resultados educacionais ou clínicos iguais para todos.

## Verificações realizadas

- O projeto contém 17 tópicos, 82 animações e todos os 82 arquivos `.blend` correspondentes.
- A URL e a chave publicável informadas responderam ao endpoint de saúde do Supabase Auth.
- O fluxo completo de e-mail, sessão, RLS e Storage só pode ser confirmado depois de aplicar as migrações, configurar redirecionamentos/SMTP e usar contas de teste com acesso ao e-mail. Use os passos desta seção antes de liberar o cadastro ao público.
