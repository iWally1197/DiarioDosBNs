# Supabase do Diário dos BNs

Este guia explica a ligação atual do site. O projeto Supabase é `glzerebxnlkdtsbrwbhh` e o site publicado usa `https://diariodosbns.com.br`.

## 1. O que já está pronto

O banco conectado já tem as migrações do site, incluindo cadastro, perfis, turmas, atividades e permissões. As duas últimas são:

- `20261007120000_auth_signup_profile_metadata`
- `20261008013041_restrict_internal_function_execution`

Não cole nem execute essas migrações novamente no mesmo projeto. Elas já aparecem no histórico do Supabase. Os dados, as turmas e as contas foram mantidos.

## 2. Confira os endereços de retorno

No Supabase, abra **Authentication → URL Configuration**. O endereço principal deve ser:

```text
https://diariodosbns.com.br
```

Em **Redirect URLs**, deixe liberados estes dois endereços:

```text
https://diariodosbns.com.br/auth-callback.html
https://diariodosbns.com.br/recuperar-senha.html?mode=update
```

Eles precisam apontar para as páginas do site que estão no GitHub Pages.

## 3. Confirme o envio de e-mail

Em **Authentication → Providers → Email**, confirme que o provedor Email está ligado e que novos cadastros estão permitidos. Confirme também um endereço remetente válido em **Authentication → SMTP Settings**. A confirmação de cadastro e o link de recuperação dependem desse envio.

Para proteger melhor as contas, ative no painel a opção de bloquear senhas já expostas em vazamentos. Esse ajuste é feito na configuração de Auth do painel, não no código do site.

## 4. Chave que aparece no site

O arquivo `supabase-config.js` contém a URL do projeto e uma chave publicável. Essa chave pode aparecer no navegador. Ela não substitui as políticas RLS do banco.

Nunca publique uma chave `sb_secret`, `service_role`, senha do banco ou credenciais do Resend. Também não envie `.env.local` para o GitHub.

## 5. Como o cadastro funciona

1. O aluno ou professor preenche os campos e aceita os Termos e a Política de Privacidade.
2. O Supabase envia uma confirmação para o e-mail, se a confirmação estiver ligada.
3. O aluno recebe acesso ativo. O pedido de professor fica aguardando a aprovação do administrador.
4. Depois de entrar, o aluno pode usar o código recebido para acessar uma turma.

Não existe opção pública para criar uma conta de administrador. O sistema não mostra se um e-mail já está cadastrado.

## 6. Se for conectar outro projeto

Antes de executar qualquer SQL, confira o histórico de migrações desse outro projeto. Não execute migrações antigas sobre tabelas que já existem. Use a Supabase CLI para aplicar as migrações da pasta `supabase/migrations` na ordem dos nomes e depois atualize `supabase-config.js` com a URL e a chave publicável do novo projeto.

O GitHub Pages só publica arquivos estáticos; ele não inicia `server.mjs` e não precisa de uma chave privada no navegador.

## Erros comuns

- **Cadastro não termina:** confira a conexão, as URLs de retorno e se o perfil Email permite novos cadastros. A tela deve mostrar uma mensagem se o serviço demorar.
- **O e-mail de confirmação não chega:** confira spam, SMTP e o endereço remetente.
- **Professor vê acesso pendente:** isso é esperado até o administrador aprovar o cadastro.
- **Erro de tabela ou função:** confira se o site e o painel Supabase estão usando o projeto `glzerebxnlkdtsbrwbhh` e consulte o histórico de migrações antes de executar qualquer SQL.
