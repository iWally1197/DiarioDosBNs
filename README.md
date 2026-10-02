# Diário dos BNs

Site responsivo em português para explorar tópicos de Física, baixar projetos 3D e aprender a usar o Blender.

## Executar o site

Abra `index.html` em um navegador. Não é necessário instalar ferramentas nem compilar os arquivos. A tipografia pode ser carregada do Google Fonts; sem conexão, o navegador usa fontes substitutas.

## O que está incluído

- `index.html`: apresentação, biblioteca de tópicos e downloads em destaque.
- `topico.html`: página de conteúdo montada para cada assunto selecionado.
- `topicos.js`: 17 tópicos e 82 animações com explicações editáveis.
- `downloads/`: 82 projetos Blender `.blend`, prontos para abrir e editar.
- `blender.html`: guia de navegação, modelagem, materiais, iluminação, animação e renderização.
- `styles.css` e `script.js`: tema visual, layout responsivo, menu e alternância de tema.
- `assets/diario-dos-bns-logo.jpeg`: logotipo fornecido, usado no cabeçalho, na capa e como ícone da página.

Os projetos `.blend` são modelos didáticos esquemáticos. Eles incluem uma cena 3D editável e uma linha do tempo animada; adapte a representação e as explicações ao conteúdo e à atividade proposta. As escalas e movimentos são ilustrativos.

## Abrir uma animação no Blender

Baixe o projeto na página do tópico e abra-o no Blender pelo menu **Arquivo → Abrir**. Pressione `0` no teclado numérico para ver pela câmera e `Espaço` para reproduzir ou pausar. O guia Blender explica como navegar pela cena, mover objetos e usar atalhos como `G`, `R`, `S` e `Shift+S`.

## Adicionar vídeos do YouTube ao guia Blender

Na página `blender.html`, cada quadro tracejado é uma área reservada para uma aula em vídeo. Para incorporar um vídeo, substitua o bloco `video-placeholder` pelo código abaixo e troque `ID_DO_VIDEO` pelo ID real do YouTube:

```html
<iframe
  class="youtube-embed"
  src="https://www.youtube-nocookie.com/embed/ID_DO_VIDEO"
  title="Descrição da aula"
  loading="lazy"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
```

O ID é a parte depois de `v=` no endereço normal do vídeo. Por exemplo, em `youtube.com/watch?v=abc123`, o ID é `abc123`.

## Personalizar os materiais

Edite os títulos, descrições e listas de animação diretamente em `topicos.js`. Cada arquivo `.blend` correspondente usa o padrão `downloads/ID-DA-ANIMACAO.blend`, descrito na página do tópico. Cores e layout ficam nas variáveis no início de `styles.css`.

Os materiais são recursos de apoio. Ajuste ritmo, estímulos, conteúdos e modo de uso às necessidades e preferências de cada estudante; não há uma única forma de aprender que sirva para todas as pessoas.
