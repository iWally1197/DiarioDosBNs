# Diário dos BNs

Site de Física com animações e cenas do Blender, laboratório e materiais didáticos. O projeto mantém o conteúdo atual e usa GitHub Pages para as páginas públicas e Supabase para contas, turmas e atividades.

## Publicar

Envie os arquivos desta pasta para a raiz da branch `main` do repositório. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`. Aguarde a publicação terminar. O arquivo `.nojekyll` já está incluído.

O GitHub Pages publica arquivos estáticos; ele não executa `server.mjs`. O servidor local é apenas para desenvolvimento. Não envie arquivos `.env` nem chaves privadas.

Na página inicial, os atalhos **Criar conta** e **Entrar na conta** abrem os formulários direto. Os formulários mostram os campos mesmo quando a conexão ainda está carregando e exibem uma mensagem se a conexão falhar.

## Supabase usado pelo site

- Projeto: `glzerebxnlkdtsbrwbhh`
- Site: `https://diariodosbns.com.br`
- Retornos de autenticação permitidos:
  - `https://diariodosbns.com.br/auth-callback.html`
  - `https://diariodosbns.com.br/recuperar-senha.html?mode=update`

As migrações de cadastro e de proteção de funções já foram aplicadas nesse projeto. **Não execute novamente** arquivos de migração no mesmo banco. Para conferir o histórico, use a lista de migrações do Supabase.

O [tutorial do Supabase](TUTORIAL-SUPABASE.md) mostra os endereços de retorno e o envio de e-mail.

O navegador usa uma chave publicável. Nunca coloque `sb_secret`, `service_role`, senha do banco ou credenciais do Resend nos arquivos do site ou no GitHub.

No painel do Supabase, confirme que o provedor de e-mail está habilitado, que os retornos acima estão liberados e que a proteção contra senhas vazadas está ativada. A confirmação de conta e a recuperação de senha também dependem do serviço de e-mail configurado no Supabase/Resend.

## Migrações

As migrações versionadas ficam em `supabase/migrations`. Elas registram a estrutura do banco sem apagar contas ou turmas. O projeto Supabase conectado já tem o histórico até `20261008013041_restrict_internal_function_execution`.

Se for configurar outro banco, confira o histórico dele antes de aplicar arquivos. Use a Supabase CLI para aplicar as migrações na ordem dos nomes; não cole migrações antigas sobre objetos que já existem.

## Conteúdo

- `index.html`: página inicial e biblioteca de tópicos.
- `topico.html` e `animacao.html`: conceitos e animações.
- `downloads.html` e arquivos `.blend`: projetos Blender públicos.
- `blender.html`: tutorial de Blender.
- `laboratorio.html`, `professores.html` e `pesquisa.html`: laboratório e materiais de apoio.
- `cadastro.html`, `login.html`, `recuperar-senha.html` e `auth-callback.html`: cadastro, login e recuperação.
- `turmas.html`, `turma.html` e as áreas de perfil: funções de turma conforme o papel e as permissões no banco.

Os arquivos públicos do repositório não devem conter materiais privados de alunos ou professores. As permissões dos dados privados são controladas pelo Supabase e pelas regras RLS.
