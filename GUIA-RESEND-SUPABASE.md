# Configurar Resend no Supabase: passo a passo

Este guia liga o Resend ao Supabase para enviar confirmação de cadastro e recuperação de senha do Diário dos BNs.

Se você ainda vai registrar e conectar um domínio `.com.br` ao GitHub Pages, comece pelo [GUIA-DOMINIO-RESEND-SUPABASE.md](GUIA-DOMINIO-RESEND-SUPABASE.md).

## Antes de começar

Para enviar mensagens aos usuários do site, tenha um domínio seu e acesso ao painel onde configura o DNS dele. Pode ser um domínio `.com`. O Resend precisa verificar que você controla esse domínio antes de permitir que ele seja usado como remetente.

## Parte 1 — Criar conta e verificar o domínio no Resend

1. Crie uma conta em [resend.com/signup](https://resend.com/signup) e confirme seu e-mail.
2. No painel do Resend, abra **Domains** e escolha **Add Domain**.
3. Digite o domínio que você possui, por exemplo `diariodosbns.com`.
4. O Resend mostrará registros DNS (como SPF e DKIM) próprios para esse domínio. Copie os valores apresentados.
5. Abra o painel da empresa onde você comprou/gerencia o domínio e acesse a área **DNS** ou **Gerenciar DNS**.
6. Adicione os registros exatamente como o Resend os mostrou. Não invente valores e não apague registros existentes sem saber para que servem.
7. Volte ao Resend e clique em **Verify**. Aguarde até o domínio aparecer como verificado.

O Resend exibe os registros necessários para cada domínio. A propagação do DNS pode levar um tempo. Se você ainda não tem domínio, será necessário registrar um antes de concluir o envio para usuários reais.

## Parte 2 — Criar a credencial SMTP no Resend

1. No Resend, abra **API Keys** e clique em **Create API Key**.
2. Dê um nome fácil de reconhecer, como `Supabase Diario dos BNs`.
3. Selecione permissão de envio (**Sending access**) e, se disponível, limite a chave ao domínio verificado.
4. Crie a chave e copie-a. Guarde-a em local privado; ela será a senha SMTP.

Para o SMTP do Resend, use:

| Campo no Supabase | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Porta | `465` |
| Usuário | `resend` |
| Senha | A API Key criada no Resend |
| Nome do remetente | `Diário dos BNs` |
| E-mail do remetente | Um endereço do seu domínio verificado, por exemplo `nao-responda@diariodosbns.com` |

O endereço usado como remetente deve pertencer ao domínio verificado no Resend.

## Parte 3 — Colocar os dados no Supabase

1. Abra o [painel do Supabase](https://supabase.com/dashboard) e escolha o projeto do Diário dos BNs.
2. Vá para **Authentication → Emails → SMTP Settings**. Dependendo da versão do painel, pode aparecer como **Authentication → SMTP Settings**.
3. Ative **Custom SMTP** ou **Enable custom SMTP**.
4. Preencha host, porta, usuário, senha e remetente com os valores da tabela acima.
5. Salve as alterações.

**Não coloque a API Key no site, em `supabase-config.js`, no GitHub ou neste chat.** Digite-a somente no campo de senha SMTP dentro do painel do Supabase. Ela não é a chave publicável `sb_publishable_...`.

## Parte 4 — Conferir para onde os links voltam

No Supabase, abra **Authentication → URL Configuration** e confira:

- **Site URL:** `https://iwally1197.github.io/DiarioDosBNs/`
- **Redirect URLs permitidas:**

  ```text
  https://iwally1197.github.io/DiarioDosBNs/auth-callback.html
  https://iwally1197.github.io/DiarioDosBNs/recuperar-senha.html?mode=update
  ```

Esses endereços correspondem ao site publicado na raiz do repositório; os materiais 3D ficam na subpasta `animacoes-3d`. Se publicar em outro domínio ou repositório, troque-os pelos endereços reais do site.

## Parte 5 — Testar

1. No site, abra **Entrar → Esqueci minha senha**.
2. Informe um e-mail de conta existente e solicite o link.
3. Confira a caixa de entrada e o spam.
4. Abra o link e defina uma senha nova.
5. No Resend, abra a área de e-mails enviados para verificar se houve envio ou erro.

Se a mensagem não chegar, confirme que o domínio aparece como verificado no Resend, que os dados SMTP foram copiados sem espaços e que o remetente pertence ao domínio. No Supabase, confira também **Authentication → Logs**. O SMTP padrão do Supabase pode restringir os destinatários; depois de configurar SMTP próprio, respeite os limites exibidos no painel.

## Links oficiais

- [Criar conta no Resend](https://resend.com/signup)
- [Configurar SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Dados SMTP do Resend](https://resend.com/changelog/smtp-service)
- [Permissões das chaves do Resend](https://resend.com/changelog/new-api-key-permissions)
- [Redirecionamentos do Supabase](https://supabase.com/docs/guides/auth/redirect-urls)
