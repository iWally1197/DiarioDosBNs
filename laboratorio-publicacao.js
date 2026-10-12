export const laboratoryPublicationRecords = Object.freeze([
  { id: "mru", slug: "lab-mru", title: "MRU — Movimento retilíneo uniforme", topic: "Laboratório de Física", summary: "Carrinho em pista com referencial fixo, posição e velocidade constantes.", level: "Ensino médio" },
  { id: "muv", slug: "lab-mruv", title: "MRUV — Movimento retilíneo uniformemente variado", topic: "Laboratório de Física", summary: "Carrinho com aceleração constante, posição e velocidade em relação à pista.", level: "Ensino médio" },
  { id: "projectile", slug: "lab-lancamento-obliquo", title: "Lançamento oblíquo", topic: "Laboratório de Física", summary: "Trajetória de um projétil e componentes da velocidade sob gravidade uniforme.", level: "Ensino médio" },
  { id: "optics-reflection", slug: "lab-espelho-plano", title: "Espelho plano", topic: "Laboratório de Física", summary: "Lei da reflexão, direção do feixe e formação da imagem no espelho plano.", level: "Ensino médio" },
  { id: "optics-convex-mirror", slug: "lab-espelho-convexo", title: "Espelho convexo", topic: "Laboratório de Física", summary: "Raios refletidos divergentes e imagem virtual atrás do espelho convexo.", level: "Ensino médio" },
  { id: "lens-diverging", slug: "lab-lente-divergente", title: "Lente divergente", topic: "Laboratório de Física", summary: "Raios divergentes, foco virtual e imagem virtual, direita e reduzida.", level: "Ensino médio" },
  { id: "lab-magnetic-field", slug: "lab-imas-e-eletroimas", title: "Ímãs e eletroímãs — Explorando o campo magnético", topic: "Laboratório de Física", summary: "Campo de ímãs permanentes e bobinas; bússola, sensor digital e gráficos.", level: "Ensino médio" }
]);
export const laboratoryPublicationByExperimentId = new Map(laboratoryPublicationRecords.map((item) => [item.id, item]));
export const laboratoryPublicationSlugs = Object.freeze(laboratoryPublicationRecords.map((item) => item.slug));
