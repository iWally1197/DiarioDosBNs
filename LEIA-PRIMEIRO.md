# Atualização do Diário dos BNs — 5 de outubro de 2026

## Arquivos para o site

O ZIP `DiarioDosBNs-atualizacao-site.zip` contém os arquivos de atualização soltos, sem subpastas. No GitHub, extraia e copie os arquivos para a mesma pasta raiz onde já estão `index.html`, `src-supabase.js`, `script.js`, `accessibility.js` e `supabase-config.js`, substituindo os arquivos com o mesmo nome.

O pacote acrescenta as páginas `apoie.html` e `turma.html` e atualiza `index.html`, `src-app.js`, `features.js` e `styles.css`. Os outros arquivos do site precisam continuar no repositório.

## Migração do Supabase

O arquivo `supabase-migrations-20261005120000_classrooms_pix_approvals.sql` é uma migração de banco. **Não o publique junto com o site no GitHub Pages.** Abra o SQL Editor do projeto Supabase, cole o conteúdo inteiro e execute uma vez, depois das migrações anteriores de banco, perfis/turmas e downloads privados. Se alguma delas ainda não foi aplicada, execute-as antes e na ordem descrita no tutorial Supabase do projeto.

A migração cria as tabelas e políticas para turmas, permissões, verificação de professores, notificações, atividades, links e arquivos privados, além do bucket privado `class-materials`. Ela não contém chave secreta. Não coloque a `service_role` no navegador ou no GitHub.

## Configuração inicial

1. Faça uma cópia/commit dos arquivos atuais do site.
2. Aplique a migração no projeto Supabase correto e confirme que o SQL Editor terminou sem erro.
3. Copie os seis arquivos do ZIP para a raiz do site e publique a atualização.
4. No painel administrativo, preencha a chave PIX e o link HTTPS do QR Code.
5. Crie uma turma, vincule um professor verificado e ajuste as permissões antes de testar as atividades.
6. Para receber confirmações e redefinições de senha por e-mail, mantenha SMTP/Resend e os URLs permitidos do Supabase configurados.

## O que foi verificado aqui

Os scripts JavaScript passaram na checagem de sintaxe e as páginas/arquivos principais responderam com HTTP 200 no servidor local. Não foi possível validar cadastro, e-mail, RLS ou operações de banco contra usuários reais, pois esta execução não está conectada ao Supabase remoto do site. Faça o fluxo de teste no seu projeto depois de aplicar a migração.
