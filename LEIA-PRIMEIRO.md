# Diário dos BNs

O site agora é público e pode ser usado sem conta. Não há cadastro, login, recuperação de senha, perfil pessoal ou área de turma.

Para publicar: no GitHub, selecione a branch `main` e a pasta raiz em **Settings → Pages**. A pasta `animacoes-3d` e os arquivos do site precisam permanecer juntos.

Os arquivos SQL e a pasta `supabase/migrations` foram mantidos como histórico do banco já existente. Não execute migrations antigas para publicar o site; a publicação no GitHub Pages não altera o Supabase nem apaga as contas e os dados que já estão lá.

A página `apoie.html` usa somente uma consulta pública para exibir as informações de apoio. As demais páginas não carregam o cliente de autenticação do Supabase.
