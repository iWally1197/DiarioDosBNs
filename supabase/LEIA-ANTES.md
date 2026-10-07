# Pasta Supabase

Esta pasta tem o arquivo de configuração do Supabase, a cópia organizada das migrations já existentes e uma migration nova para reparar as permissões dos downloads privados.

Mantenha a pasta `supabase` na raiz do repositório. O Supabase CLI procura as migrations em `supabase/migrations`.

Não execute novamente a migration principal de 2026-10-03 no SQL Editor: ela cria tipos e tabelas que já podem existir. Antes de publicar uma migration nova no banco existente, confira a lista de migrations locais e remotas; as versões antigas devem estar marcadas como aplicadas. O site no GitHub Pages não executa o servidor Node; login e dados dependem do projeto Supabase configurado.
