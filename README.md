# Diário dos BNs

Site responsivo para estudar Física com animações e cenas Blender, laboratório 3D e materiais de apoio. Inclui contas de aluno, professor e administrador com Supabase.

## Arquivos em uma única pasta

Esta cópia não tem subpastas. Para evitar nomes repetidos, os arquivos foram renomeados com prefixos: `assets-` para imagens, `downloads-` para cenas Blender, `src-` para módulos do site e `supabase-` para SQL. As páginas de conta são arquivos como `login.html`, `cadastro.html`, `recuperar-senha.html`, `aluno.html`, `professor.html`, `admin.html`, `perfil.html` e `auth-callback.html`.

## Publicar no GitHub Pages

Envie todos os arquivos diretamente para a raiz do repositório, sem criar subpastas. Em **Settings → Pages**, escolha a branch principal e a pasta raiz. O arquivo `.nojekyll` também está incluído. Não envie `.env.local`.

Depois configure o Supabase em **Authentication → URL Configuration**:

- **Site URL:** `https://iwally1197.github.io/DiarioDosBNs/`
- URL permitida: `https://iwally1197.github.io/DiarioDosBNs/auth-callback.html`
- URL permitida: `https://iwally1197.github.io/DiarioDosBNs/recuperar-senha.html?mode=update`

O GitHub Pages publica arquivos estáticos e não executa `server.mjs`. Para executar localmente, instale Node.js 20 ou superior e rode `npm start` nesta pasta; o servidor mapeia as rotas legadas para os arquivos HTML correspondentes.

## Configuração do Supabase

O navegador lê `supabase-config.js`. Preencha com a URL do projeto e a chave publicável:

```js
export const supabaseConfig = Object.freeze({
  url: 'https://SEU-PROJETO.supabase.co',
  publishableKey: 'sb_publishable_SUA_CHAVE_PUBLICAVEL',
  configured: true
});
```

A chave `sb_publishable_...` pode estar no navegador. **Nunca** coloque `sb_secret`, `service_role` ou senha do banco neste arquivo ou em repositório público.

No SQL Editor do Supabase, execute nesta ordem:

1. `supabase-migrations-20261003120000_diario_bns_core.sql`
2. `supabase-seed.sql`
3. Crie no Storage o bucket privado `downloads`.
4. `supabase-migrations-20261003121000_private_download_storage.sql`

Para o primeiro administrador, use `supabase-bootstrap-admin.sql.example` no SQL Editor após criar e confirmar sua conta. Cadastros de professor começam aguardando aprovação.

Ative a confirmação de e-mail e ajuste as URLs de redirecionamento para o domínio da publicação. A chave pública não substitui as políticas RLS do banco.

## Páginas e conteúdo

- `index.html`: início e biblioteca de tópicos.
- `topico.html` e `animacao.html`: detalhes dos conceitos e cenas para abrir no Blender.
- `downloads.html`: catálogo de projetos Blender. Cada arquivo `.blend` correspondente tem prefixo `downloads-`.
- `blender.html`: tutorial de navegação, seleção, transformação, `Shift+S`, modelagem, materiais, luz, animação e renderização.
- `laboratorio.html`, `professores.html` e `pesquisa.html`: laboratório, recursos pedagógicos e informações sobre o projeto.
- `cadastro.html`, `login.html`, `recuperar-senha.html`, `auth-callback.html`, `perfil.html`, `aluno.html`, `professor.html` e `admin.html`: autenticação e áreas por tipo de conta.

O site usa cenas Blender públicas no repositório e downloads privados no Storage do Supabase. Não coloque materiais docentes privados nesta pasta pública.

Os termos e a política de privacidade são minutas para revisão. Adapte materiais às necessidades individuais; o site não promete resultados educacionais ou clínicos iguais para todos.
