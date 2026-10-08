# Atualização segura do Diário dos BNs

Este pacote preserva as páginas de Física, Blender e os arquivos 3D existentes. As telas de entrar, criar conta, recuperar senha, turmas e turma usam páginas simples, com os campos visíveis antes de carregar o Supabase. Se a conexão demorar, a tela mostra um erro e libera o botão para tentar de novo.

## Publicação

Envie o conteúdo desta pasta para a raiz da branch `main` do repositório do site e aguarde o GitHub Pages terminar. A página inicial tem dois atalhos diretos: **Criar conta** e **Entrar na conta**. O GitHub Pages publica arquivos estáticos; `server.mjs` é somente para uso local e não roda no Pages.

## Conta e turmas

- Cadastro de aluno ou professor, aceite dos termos, confirmação por e-mail, login e recuperação de senha.
- Professores começam aguardando aprovação. O cadastro público não cria administradores.
- Após entrar, cada perfil segue para sua área existente. Alunos entram em turmas com o código recebido.
- A turma mostra aulas, avisos, materiais e atividades conforme as permissões já existentes no Supabase.

## Supabase

O banco conectado é o projeto `glzerebxnlkdtsbrwbhh`. A migração de cadastro `20261007120000_auth_signup_profile_metadata` e a correção de permissões `20261008013041_restrict_internal_function_execution` já foram aplicadas nesse projeto. Não execute esses arquivos de novo no mesmo projeto.

Para outro projeto Supabase, aplique as migrações pela CLI na ordem dos nomes dentro de `supabase/migrations`. Não cole as migrações antigas sobre um banco que já tem os mesmos objetos sem primeiro conferir o histórico.

Em **Authentication → URL Configuration**, confira se a URL publicada está liberada, incluindo:

- `https://diariodosbns.com.br/auth-callback.html`
- `https://diariodosbns.com.br/recuperar-senha.html?mode=update`

O envio de confirmação e de recuperação depende do provedor de e-mail configurado no Supabase/Resend. A configuração do site usa somente uma chave publicável. Nunca coloque `service_role`, `sb_secret`, senhas ou chaves privadas no GitHub.

## O que foi verificado

- Sintaxe do JavaScript das telas de conta.
- Referências locais a páginas, scripts, estilos e imagens.
- Histórico de migrações e permissões de funções do projeto Supabase conectado.
- As contas, turmas e dados existentes foram mantidos.

O cadastro real depende de e-mail ativo e das URLs de retorno liberadas no Supabase. Para testar o envio completo sem criar contas reais, é preciso usar uma conta de teste autorizada.
