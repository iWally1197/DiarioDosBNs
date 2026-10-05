# Guia simples: configurar SMTP para os e-mails do site

SMTP é o serviço que envia e-mails de confirmação e recuperação de senha. O Supabase cuida do login; o SMTP entrega a mensagem na caixa de entrada.

## O que você precisa

Crie uma conta em um serviço de envio de e-mail transacional. No painel desse serviço, siga as etapas para verificar o endereço ou domínio que será usado como remetente. Depois, copie os dados SMTP fornecidos:

- **Servidor/Host SMTP**
- **Porta**
- **Usuário SMTP**
- **Senha SMTP** ou chave SMTP
- **E-mail remetente** verificado, por exemplo `nao-responda@seudominio.com`

Não use a senha normal da sua caixa de e-mail. Use a credencial SMTP criada pelo serviço.

## Configuração no Supabase

1. Abra o [painel do Supabase](https://supabase.com/dashboard) e selecione o projeto do Diário dos BNs.
2. Entre em **Authentication → Emails → SMTP Settings**. Em algumas versões do painel, a opção aparece como **Authentication → SMTP Settings**.
3. Ative o SMTP personalizado.
4. Preencha o host, a porta, o usuário e a senha SMTP fornecidos pelo serviço de e-mail.
5. Defina o remetente com o nome **Diário dos BNs** e o e-mail remetente que você verificou.
6. Salve as alterações.

## Teste de recuperação

1. Abra o site publicado e escolha **Entrar → Esqueci minha senha**.
2. Informe um e-mail cadastrado e envie a solicitação.
3. Confira a caixa de entrada e a pasta de spam. O primeiro envio pode levar alguns minutos.
4. Abra o link no mesmo navegador em que solicitou a recuperação e escolha a nova senha.

Se não chegar, confira no serviço SMTP se o domínio remetente foi verificado e se as configurações de autenticação (SPF/DKIM) pedidas pelo serviço foram adicionadas ao domínio. Consulte também o painel/logs de envio do provedor e as configurações de redirecionamento em **Supabase → Authentication → URL Configuration**.

## Importante para segurança

Digite a senha SMTP somente no painel do Supabase. **Nunca** coloque essa senha em `supabase-config.js`, em `.env` enviado ao GitHub, no código do site ou em uma mensagem pública. A chave `sb_publishable_...` do navegador é outra coisa: ela não é a senha SMTP.

O envio SMTP padrão do Supabase serve para testes e tem restrições: pode enviar somente para endereços da equipe do projeto e possui limite baixo. Para enviar e-mails aos alunos e professores, configure um SMTP personalizado. O limite inicial após configurar SMTP também pode ser limitado pelo Supabase.

Links oficiais: [configurar SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp) · [limites de envio](https://supabase.com/docs/guides/auth/rate-limits) · [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls).

Se você escolheu o Resend, veja o tutorial específico [GUIA-RESEND-SUPABASE.md](GUIA-RESEND-SUPABASE.md).
