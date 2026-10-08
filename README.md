# Diário dos BNs

Site público para estudar Física com animações, projetos Blender, laboratório no navegador e materiais de apoio. O site funciona sem cadastro, login ou recuperação de senha.

## Publicação

O projeto é estático e pode ser publicado no GitHub Pages usando a branch `main` e a pasta raiz (`/`). A pasta `animacoes-3d` contém cenas e materiais que precisam permanecer no repositório.

Para abrir uma cópia no computador, use Node.js 20 ou mais recente e execute `npm start`. A porta padrão é 4173; ela pode ser alterada com a variável `PORT`.

## Arquivos do site

As páginas públicas usam HTML, CSS e JavaScript. As preferências de tema, acessibilidade, histórico e favoritos ficam no navegador. A página de apoio consulta apenas as informações públicas da chave PIX.

A pasta `supabase/migrations` e os arquivos SQL são o histórico do banco que já existia. Eles foram mantidos para preservar o projeto e os dados salvos. O site atual não oferece criação de contas, login, recuperação de senha ou áreas pessoais.
