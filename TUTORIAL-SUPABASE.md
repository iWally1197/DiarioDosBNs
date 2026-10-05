# Tutorial: ligar o Diário dos BNs ao Supabase

Este guia é para a cópia com todos os arquivos do site, incluindo as cenas Blender e os materiais de reprodução do processo de Penrose, diretamente na raiz e sem subpastas. Siga a ordem. Você não precisa criar tabelas manualmente: os arquivos SQL do projeto fazem isso.

## 1. Confira a configuração pública

Na pasta do site, abra `supabase-config.js`. Ele já está preenchido com a URL `https://glzerebxnlkdtsbrwbhh.supabase.co` e a chave pública `sb_publishable_YaVYI-Ox_3-7mt_hfRlh_Q_PHoSdyRG`. Essa chave é pública e pode aparecer no JavaScript que o navegador baixa.

Se conectar outro projeto Supabase, substitua `url` pela Project URL e `publishableKey` pela chave publicável encontradas no painel Supabase em **Project Settings → API Keys** (ou no botão **Connect**). Mantenha `configured: true`.

**Não coloque neste arquivo** uma chave `sb_secret_...`, `service_role`, senha do banco ou senha de usuário. Não publique `.env.local`. O site desta pasta usa `supabase-config.js` no navegador; GitHub Pages não lê arquivos `.env` e não executa servidor Node.

## 2. Crie as tabelas e permissões

1. Entre no [painel do Supabase](https://supabase.com/dashboard) e selecione o projeto cuja URL está em `supabase-config.js`.
2. Abra **SQL Editor → New query**.
3. Se ainda não executou a migração principal, abra `supabase-migrations-20261003120000_diario_bns_core.sql`, copie o arquivo inteiro para o editor e clique em **Run**. Aguarde a confirmação de sucesso. Ela cria as tabelas, funções, permissões RLS e o gatilho de perfis.
4. **Se a migração principal já terminou com sucesso, pule o passo 3. Não execute o arquivo core novamente.**
5. Em uma consulta nova, execute o arquivo completo `supabase-migrations-20261004100000_profiles_education_class_stage.sql`. Essa atualização acrescenta faixa etária, etapa de ensino, formação docente e etapa nas turmas. É a atualização necessária para os novos campos deste pacote.
6. Para conferir, rode esta consulta:

   ```sql
   select to_regclass('public.user_roles') as tabela_de_perfis;
   ```

   O resultado deve ser `user_roles`. Se aparecer `null`, a migração principal não foi aplicada no projeto certo ou terminou com erro.

Use os arquivos SQL que acompanham este pacote. Se aparecer erro de sintaxe perto de `$`, apague a consulta antiga do editor e cole novamente o arquivo inteiro, sem omitir partes. Não execute apenas um pedaço da migração. Se o editor disser que a transação anterior foi abortada, execute `ROLLBACK;` em uma consulta separada antes de tentar novamente. Se a migração core já terminou, não a repita; a atualização incremental foi feita para poder ser reaplicada.

## 3. Carregue o catálogo e configure downloads privados

O login não depende do catálogo. Para incluir os tópicos e animações iniciais do site:

1. Abra uma consulta nova e execute todo o arquivo `supabase-seed.sql`.
2. No Supabase, abra **Storage → New bucket**.
3. Crie um bucket chamado `downloads` e deixe **Public bucket** desligado (bucket privado).
4. Abra uma consulta SQL nova e execute todo o arquivo `supabase-migrations-20261003121000_private_download_storage.sql`.
5. Em outra consulta nova, execute o arquivo inteiro `supabase-migrations-20261005120000_classrooms_pix_approvals.sql`. Ele atualiza turmas, permissões, análise de professores, atividades, notificações e configurações de apoio ao site. A execução é transacional: se houver erro, as alterações dessa tentativa são desfeitas. Corrija o erro indicado e execute o arquivo inteiro novamente; não repita a migração core se ela já terminou com sucesso.

Se ainda não executou a migração de turmas, rode a versão atualizada do arquivo `supabase-migrations-20261005120000_classrooms_pix_approvals.sql`; ela substitui as políticas antigas que causam esse ciclo. Se já executou uma versão anterior dela e o painel continuar mostrando `infinite recursion detected in policy for relation "activities"`, execute em uma consulta nova `supabase-migrations-20261005130000_fix_activity_policy_recursion.sql`. Depois recarregue o site.

Os arquivos `.blend` públicos que acompanham o site continuam sendo publicados junto com o site. O bucket privado é para arquivos restritos, como materiais exclusivos de professores.

## 4. Autorize os endereços do site

No Supabase, abra **Authentication → URL Configuration**. Para o site publicado em `https://iwally1197.github.io/DiarioDosBNs/`, configure:

- **Site URL:** `https://iwally1197.github.io/DiarioDosBNs/`
- Em **Redirect URLs**, inclua estas duas linhas:

  ```text
  https://iwally1197.github.io/DiarioDosBNs/auth-callback.html
  https://iwally1197.github.io/DiarioDosBNs/recuperar-senha.html?mode=update
  ```

Salve as alterações. O nome e o caminho precisam corresponder exatamente ao endereço publicado, incluindo maiúsculas/minúsculas e o nome do repositório. Se mudar de domínio ou repositório, atualize os endereços.

Em **Authentication → Providers → Email**, mantenha o provedor de e-mail habilitado. Se a confirmação de e-mail estiver ativada, novos usuários precisam abrir o link recebido antes de entrar. Para envio confiável em um site público, configure um provedor SMTP em **Authentication → SMTP Settings**; o serviço padrão pode ter limites de envio.

**Atenção ao envio de recuperação:** sem SMTP personalizado, o Supabase pode enviar mensagens apenas para endereços autorizados na equipe do projeto, e o limite do serviço padrão é baixo. Portanto, para que alunos e professores recebam links, configure SMTP próprio em **Authentication → Emails → SMTP Settings**. Use um serviço de e-mail transacional, verifique o domínio remetente e faça um teste com um endereço que não seja da equipe. Veja as instruções oficiais: [configurar SMTP](https://supabase.com/docs/guides/auth/auth-smtp) e [limites de envio](https://supabase.com/docs/guides/auth/rate-limits).

Para instruções simples, passo a passo, sobre onde obter os dados e como testar, veja [GUIA-SMTP.md](GUIA-SMTP.md).

## 5. Publique os arquivos

Extraia o ZIP e envie todos os arquivos diretamente para a raiz do repositório `DiarioDosBNs`, sem criar uma pasta externa. Confirme que `index.html`, `supabase-config.js`, `.nojekyll`, `auth-callback.html` e os arquivos `.blend` aparecem na raiz do GitHub. Em **Settings → Pages**, publique a branch principal usando a pasta `/(root)`.

Não envie `.env.local` nem arquivos que contenham `sb_secret`/`service_role`. Não abra o site por `file://`; use a URL do GitHub Pages. Após publicar, atualize a página e tente criar uma conta de teste como Aluno.

## 6. Faça uma conta e confira o perfil

1. Abra `/cadastro.html`, crie uma conta como Aluno ou Professor e aceite os termos.
2. Confirme o e-mail, se essa opção estiver ativada.
3. Entre em `/login.html`.
4. No painel Supabase, abra **Authentication → Users** e confirme que a conta aparece.
5. No **SQL Editor**, confira a linha de perfil:

   ```sql
   select user_id, role, status
   from public.user_roles
   order by created_at desc
   limit 10;
   ```

Aluno deve ter papel `aluno` e status `active`. Professor começa como `professor`/`pending` e precisa ser aprovado pelo administrador. Administrador não pode ser escolhido no cadastro público.

Após entrar, abra **Meu perfil** para editar a foto. O formulário reduz a imagem antes de salvar. O cadastro solicita uma faixa etária, não a data exata de nascimento; para estudantes menores de idade, o site recomenda apoio de um responsável.

Se a conta já existia antes de executar a migração, o SQL atualizado tenta criar o perfil de contas antigas que registraram o aceite dos termos. Se o usuário aparece em **Authentication → Users**, mas não nesta consulta, verifique se a migração principal foi executada até o fim e se o cadastro antigo contém os aceites. Depois de corrigir, saia da conta, entre novamente e recarregue a página.

## 7. Primeiro administrador

O formulário público nunca cria administradores. Primeiro cadastre e confirme uma conta sua. Em **Authentication → Users**, copie o UUID dessa conta. Abra `supabase-bootstrap-admin.sql.example`, substitua `SEU_UUID_CONFIRMADO` pelo UUID correto nas duas ocorrências e execute o arquivo no SQL Editor. Guarde o acesso a essa conta e não compartilhe o UUID junto de dados de login.

## Erros frequentes

| Mensagem ou sintoma | O que conferir |
|---|---|
| `Could not find the table 'public.user_roles' in the schema cache` | Execute a migração principal no projeto Supabase cuja URL está no `supabase-config.js`. Depois confirme que `to_regclass('public.user_roles')` retorna a tabela. Se a tabela existir, rode `notify pgrst, 'reload schema';` no SQL Editor e tente novamente. |
| `syntax error at or near "$"` | Use o arquivo principal atualizado por inteiro; não copie uma versão antiga ou incompleta da função. |
| Cadastro/login volta para erro 404 | Confira se `auth-callback.html` e `recuperar-senha.html` estão na raiz publicada e se as URLs permitidas estão idênticas às da seção 4. |
| Conta existe em Auth, mas o site diz que não encontrou perfil | Verifique a migração principal e a consulta de perfil da seção 6. Para contas antigas, veja a observação dessa seção. |
| Link de confirmação não chega | Confira spam, provedor Email e limites de envio. Configure SMTP próprio para uso real. |
| Área de professor aparece bloqueada | Professor começa pendente; um administrador precisa aprovar a conta. |

As chaves públicas não substituem a segurança: mantenha RLS habilitado e nunca desative as políticas para “fazer funcionar”.
