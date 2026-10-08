# Atualização do cadastro, login e turmas

Este pacote substitui as páginas antigas de conta por telas separadas. Os campos aparecem antes de conectar ao Supabase; a conexão tem limite de tempo e mostra uma mensagem quando falha. Os formulários usam botões HTML normais e não interceptam cliques no restante do site.

## Arquivos

Copie os arquivos deste pacote para a raiz do repositório do site, mantendo os mesmos nomes. A página `index.html` mostra, logo no início, os botões **Criar conta** e **Entrar na conta**. A pasta `supabase/migrations` deve ficar no mesmo caminho dentro do repositório. Envie os arquivos para a raiz da branch que publica o GitHub Pages; não envie a pasta `arquivos-do-sistema-novo` inteira como uma subpasta.

O pacote inclui as páginas de login, cadastro, recuperação de senha, painel, turmas e conteúdo de cada turma. As páginas antigas `admin.html`, `aluno.html`, `professor.html`, `perfil.html` e `conta.html` agora levam ao painel novo.

## Banco Supabase

As tabelas e contas existentes são mantidas. A migração SQL incluída só atualiza a função que cria o perfil no cadastro novo; ela não apaga usuários, turmas ou dados. No Supabase, abra **SQL Editor**, copie o conteúdo de `supabase/migrations/20261007120000_auth_signup_profile_metadata.sql` e execute uma vez.

Em **Authentication → Providers → Email**, deixe habilitado o cadastro de novas contas. Em **Authentication → URL Configuration**, confira o endereço do site `https://diariodosbns.com.br` e libere estes retornos:

- `https://diariodosbns.com.br/auth-callback.html`
- `https://diariodosbns.com.br/recuperar-senha.html?mode=update`

O envio de confirmação e de recuperação depende do serviço de e-mail já configurado no Supabase/Resend. O código do site usa apenas a chave publicável do Supabase; nunca coloque uma chave `service_role` ou `sb_secret` no GitHub.

## Como funciona

- Aluno cria a conta, confirma o e-mail, entra com senha e informa o código da turma.
- Professor cria uma solicitação pendente. O administrador aprova, cria a turma e vincula o professor.
- O administrador pode configurar permissões por turma, publicar conteúdos e aprovar atividades.
- As páginas `turma.html?id=...` mostram avisos, aulas, materiais e atividades conforme as permissões já guardadas no Supabase.

Depois de enviar os arquivos ao GitHub, aguarde o GitHub Pages terminar a publicação. O cadastro e os e-mails só funcionam quando as configurações do Supabase acima estão corretas.
