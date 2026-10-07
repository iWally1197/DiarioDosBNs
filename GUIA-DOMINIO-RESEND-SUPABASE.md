# Colocar o site no domínio `.com.br` e ligar Resend ao Supabase

Este tutorial junta as três partes:

- **Registro.br** registra seu domínio `.com.br`.
- **GitHub Pages** hospeda o site e conecta o domínio.
- **Resend + Supabase** enviam os e-mails de cadastro e recuperação de senha.

O Resend não é o banco de dados: o banco e as contas continuam no Supabase. O Resend é o serviço de envio de e-mail.

Nos exemplos, troque `seudominio.com.br` pelo domínio que você registrou.

## 1. Registrar o domínio

1. Acesse [Registro.br](https://registro.br/novo-dominio/) e entre ou crie uma conta.
2. Pesquise o nome que deseja, por exemplo `diariodosbns.com.br`.
3. Se estiver disponível, registre-o seguindo as instruções do Registro.br.
4. Depois do registro, abra a administração do domínio. Você precisará conseguir editar a zona DNS.

O domínio é um serviço separado da hospedagem do GitHub Pages e pode ter cobrança e renovação próprias.

## 2. Informar o domínio ao GitHub Pages

1. No GitHub, abra o repositório `DiarioDosBNs`.
2. Entre em **Settings → Pages**.
3. Em **Custom domain**, digite `seudominio.com.br` e salve. Faça isso antes de configurar os apontamentos DNS.
4. Deixe aberta essa página para conferir o estado da configuração depois.

## 3. Criar os registros DNS do site

Na administração DNS do Registro.br, adicione os registros abaixo. No campo de nome, `@` representa o domínio principal; alguns painéis pedem para deixar esse campo vazio.

### Domínio principal (`seudominio.com.br`)

Crie quatro registros do tipo **A**, todos com nome `@`:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

### Endereço com `www` (`www.seudominio.com.br`)

Crie um registro **CNAME**:

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | `www` | `iwally1197.github.io` |

O destino do CNAME é só `iwally1197.github.io`: não acrescente `/DiarioDosBNs` nem `https://`.

Se já houver um registro `www`, edite o existente para que fique como um único CNAME apontando para `iwally1197.github.io`. Um mesmo nome não pode ter CNAME junto com registros A ou AAAA. **Não apague registros MX, TXT ou outros nomes sem conferir se são usados por e-mail ou por outro serviço.** Se o painel acusar conflito, anote o tipo e nome do registro conflitante antes de alterar.

## 4. Esperar, testar e ativar HTTPS

As mudanças DNS podem levar até 24 horas para aparecer em todos os lugares. Volte a **GitHub → Settings → Pages**. Quando o domínio estiver conectado e o certificado disponível, ative **Enforce HTTPS**. Teste `https://seudominio.com.br` e, se configurou o CNAME, `https://www.seudominio.com.br`.

## 5. Verificar o domínio de envio no Resend

Use o domínio registrado para comprovar que você pode enviar e-mail por ele. Para manter os registros do site separados dos registros de envio, você pode adicionar no Resend um subdomínio de envio, como `auth.seudominio.com.br`, se o painel do Resend aceitar essa opção.

1. Crie/acesse sua conta em [Resend](https://resend.com/signup).
2. Abra **Domains → Add Domain** e informe `auth.seudominio.com.br` (ou o domínio que decidiu usar para envio).
3. O Resend vai mostrar os registros DNS necessários para verificar o domínio e habilitar o envio.
4. No DNS do Registro.br, crie cada registro exatamente como o Resend apresentou. Não substitua os registros A do GitHub nem o CNAME `www`; não invente valores. Se houver conflito de nome, pare e confira qual registro já usa aquele nome.
5. Volte ao Resend e clique em **Verify**. Continue depois que o domínio aparecer como verificado.

Use um remetente desse domínio, por exemplo `nao-responda@auth.seudominio.com.br`.

## 6. Criar a chave e preencher o SMTP no Supabase

No Resend:

1. Abra **API Keys → Create API Key**.
2. Dê um nome como `Supabase Diario dos BNs`.
3. Escolha permissão de envio (**Sending access**) e limite ao domínio de envio se o painel oferecer essa opção.
4. Copie e guarde a chave em local privado. Você usará essa chave como senha SMTP.

No Supabase, abra seu projeto e vá para **Authentication → Emails → SMTP Settings** (em algumas versões, **Authentication → SMTP Settings**). Ative o SMTP personalizado e preencha:

| Campo no Supabase | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Porta | `465` |
| Usuário | `resend` |
| Senha SMTP | A API Key criada no Resend |
| Remetente | `nao-responda@auth.seudominio.com.br` (ou o endereço do domínio verificado) |
| Nome do remetente | `Diário dos BNs` |

Salve as configurações. **Nunca coloque a API Key em `supabase-config.js`, no site, no GitHub ou neste arquivo.** Ela deve ficar somente no campo SMTP do painel Supabase.

## 7. Atualizar os links de login do Supabase

No Supabase, acesse **Authentication → URL Configuration**. Se o endereço principal do site será `https://seudominio.com.br/`, use:

- **Site URL:** `https://seudominio.com.br/`
- Em **Redirect URLs**, adicione:

  ```text
  https://seudominio.com.br/auth-callback.html
  https://seudominio.com.br/recuperar-senha.html?mode=update
  ```

Se quiser que o acesso com `www` também funcione, acrescente as duas URLs correspondentes com `www` e teste ambas. Escolha um endereço principal e mantenha o restante das URLs igual ao domínio publicado.

## 8. Testar o fluxo completo

1. Abra o site por `https://seudominio.com.br`.
2. Crie uma conta de teste ou escolha **Entrar → Esqueci minha senha**.
3. Confira a caixa de entrada e o spam.
4. No Resend, confira a área **Emails** para ver se a mensagem foi enviada ou recusada.
5. Se não chegou, confira se o domínio aparece verificado no Resend, se os registros DNS foram copiados exatamente e se o remetente pertence ao domínio verificado. No Supabase, veja **Authentication → Logs**.

## Ajuda oficial

- [Registrar domínio no Registro.br](https://registro.br/novo-dominio/)
- [Domínio personalizado no GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Configuração SMTP do Resend no Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Dados SMTP do Resend](https://resend.com/changelog/smtp-service)
- [URLs de autenticação do Supabase](https://supabase.com/docs/guides/auth/redirect-urls)
