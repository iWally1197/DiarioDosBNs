export const laboratoryPublicationRecords = Object.freeze([
  { id: "mru", slug: "lab-mru", title: "MRU — Movimento retilíneo uniforme", topic: "Laboratório de Física", summary: "Carrinho em pista com referencial fixo, posição e velocidade constantes.", level: "Ensino médio" },
  { id: "muv", slug: "lab-mruv", title: "MRUV — Movimento retilíneo uniformemente variado", topic: "Laboratório de Física", summary: "Carrinho com aceleração constante, posição e velocidade em relação à pista.", level: "Ensino médio" },
  { id: "projectile", slug: "lab-lancamento-obliquo", title: "Lançamento oblíquo", topic: "Laboratório de Física", summary: "Trajetória de um projétil e componentes da velocidade sob gravidade uniforme.", level: "Ensino médio" },
  { id: "optics-reflection", slug: "lab-espelho-plano", title: "Espelho plano", topic: "Laboratório de Física", summary: "Lei da reflexão, direção do feixe e formação da imagem no espelho plano.", level: "Ensino médio" },
  { id: "optics-concave-mirror", slug: "lab-espelho-concavo", title: "Espelho esférico côncavo", topic: "Laboratório de Física", summary: "Compare o modelo paraxial e a reflexão geométrica na calota esférica.", level: "Ensino médio", is_published: true },
  { id: "optics-concave-parabolic-mirror", slug: "lab-espelho-parabolico", title: "Espelho côncavo parabólico", topic: "Laboratório de Física", summary: "Acompanhe a reflexão exata na parábola e a convergência de raios colimados no foco.", level: "Ensino médio" },
  { id: "optics-convex-mirror", slug: "lab-espelho-convexo", title: "Espelho convexo", topic: "Laboratório de Física", summary: "Raios refletidos divergentes e imagem virtual atrás do espelho convexo.", level: "Ensino médio" },
  { id: "lens-diverging", slug: "lab-lente-divergente", title: "Lente divergente", topic: "Laboratório de Física", summary: "Raios divergentes, foco virtual e imagem virtual, direita e reduzida.", level: "Ensino médio" },
  { id: "lab-magnetic-field", slug: "lab-imas-e-eletroimas", title: "Ímãs e eletroímãs — Explorando o campo magnético", topic: "Laboratório de Física", summary: "Campo de ímãs permanentes e bobinas; bússola, sensor digital e gráficos.", level: "Ensino médio" }
]);
export const laboratoryPublicationByExperimentId = new Map(laboratoryPublicationRecords.map((item) => [item.id, item]));
export const laboratoryPublicationSlugs = Object.freeze(laboratoryPublicationRecords.map((item) => item.slug));
