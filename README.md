# Diário dos BNs

Site responsivo para estudar Física com animações e cenas Blender, laboratório 3D e materiais de apoio. Inclui contas de aluno, professor e administrador com Supabase.

## Comece por aqui

Siga o [Tutorial do Supabase](TUTORIAL-SUPABASE.md) passo a passo. Ele explica como executar o SQL, configurar os redirecionamentos, publicar no GitHub Pages e resolver o erro da tabela `user_roles`.

Para ativar e testar o envio de e-mails de confirmação e recuperação de senha, siga também o [Guia simples de SMTP](GUIA-SMTP.md).

Se escolheu Resend, use o passo a passo específico [Resend + Supabase](GUIA-RESEND-SUPABASE.md).

Para começar do zero com um domínio `.com.br`, GitHub Pages, Resend e Supabase, siga [este tutorial completo](GUIA-DOMINIO-RESEND-SUPABASE.md).

## Organização dos arquivos

Os arquivos HTML, JavaScript, CSS, SQL e guias ficam na raiz. A única subpasta é `animacoes-3d`, que reúne as cenas `.blend`, o vídeo do processo de Penrose e sua imagem de capa. Mantenha esse nome ao publicar: os links de reprodução e download já apontam para ela.

## Publicar no GitHub Pages

Envie os arquivos que estão na raiz desta pasta para a raiz do repositório e envie também a subpasta `animacoes-3d` inteira, preservando o nome. Em **Settings → Pages**, escolha a branch principal e a pasta raiz. O arquivo `.nojekyll` também está incluído. Não envie `.env.local`.

Depois configure o Supabase em **Authentication → URL Configuration**:

- **Site URL:** `https://iwally1197.github.io/DiarioDosBNs/`
- URL permitida: `https://iwally1197.github.io/DiarioDosBNs/auth-callback.html`
- URL permitida: `https://iwally1197.github.io/DiarioDosBNs/recuperar-senha.html?mode=update`

O GitHub Pages publica arquivos estáticos e não executa `server.mjs`. Para executar localmente, instale Node.js 20 ou superior e rode `npm start` nesta pasta; o servidor usa `supabase-config.js` automaticamente e mapeia as rotas para os arquivos HTML correspondentes. Se preferir configurar o servidor por variáveis de ambiente, copie `.env.example` para `.env.local`.

## Configuração do Supabase

O navegador lê `supabase-config.js`, que já está preenchido com a URL do projeto e a chave publicável:

```js
export const supabaseConfig = Object.freeze({
  url: 'https://glzerebxnlkdtsbrwbhh.supabase.co',
  publishableKey: 'sb_publishable_YaVYI-Ox_3-7mt_hfRlh_Q_PHoSdyRG',
  configured: true
});
```

A chave `sb_publishable_...` pode estar no navegador. **Nunca** coloque `sb_secret`, `service_role` ou senha do banco neste arquivo ou em repositório público.

No SQL Editor do Supabase, execute nesta ordem. A migração principal só deve ser executada uma vez; não repita se já terminou com sucesso:

1. `supabase-migrations-20261003120000_diario_bns_core.sql`
2. `supabase-migrations-20261004100000_profiles_education_class_stage.sql` (novas colunas de perfil e etapa escolar das turmas; esta atualização pode ser reaplicada)
3. `supabase-seed.sql`
4. Crie no Storage o bucket privado `downloads`.
5. `supabase-migrations-20261003121000_private_download_storage.sql`
6. `supabase-migrations-20261005120000_classrooms_pix_approvals.sql` (turmas, aprovações, atividades, notificações e PIX; pode ser reaplicada)

Se essa migração já foi executada e o painel mostrar `infinite recursion detected in policy for relation "activities"`, execute `supabase-migrations-20261005130000_fix_activity_policy_recursion.sql` para corrigir as políticas RLS.

Se a migração principal já foi executada no seu projeto, **não a execute novamente**: rode somente a migração incremental do item 2 e siga a partir daí. O formulário guarda faixa etária, sem pedir data de nascimento. A lista docente oferece formações comuns e permite digitar cursos que não aparecem nela.

Para o primeiro administrador, use `supabase-bootstrap-admin.sql.example` no SQL Editor após criar e confirmar sua conta. Cadastros de professor começam aguardando aprovação.

Ative a confirmação de e-mail e ajuste as URLs de redirecionamento para o domínio da publicação. A chave pública não substitui as políticas RLS do banco.

## Páginas e conteúdo

- `index.html`: início e biblioteca de tópicos.
- `topico.html` e `animacao.html`: detalhes dos conceitos e cenas para abrir no Blender.
- `downloads.html`: catálogo de projetos Blender. As cenas com prefixo `downloads-` ficam em `animacoes-3d/`.
- `blender.html`: tutorial de navegação, seleção, transformação, `Shift+S`, modelagem, materiais, luz, animação e renderização.
- `laboratorio.html`, `professores.html` e `pesquisa.html`: laboratório, recursos pedagógicos e informações sobre o projeto.
- `cadastro.html`, `login.html`, `recuperar-senha.html`, `auth-callback.html`, `perfil.html`, `aluno.html`, `professor.html` e `admin.html`: autenticação e áreas por tipo de conta.

O site usa cenas Blender públicas no repositório e downloads privados no Storage do Supabase. Não coloque materiais docentes privados nesta pasta pública.

Os termos e a política de privacidade são minutas para revisão. Adapte materiais às necessidades individuais; o site não promete resultados educacionais ou clínicos iguais para todos.
