/* Banco inicial: questões didáticas autorais e uma questão de referência fornecida pelo usuário. */
window.DIARIO_QUESTIONS = [
  {
    id:"uece-magnetismo-fios-2007",
    title:"Dois fios longos e o campo magnético no ponto P",
    discipline:"Física", subject:"Magnetismo", subtopic:"Campo magnético de correntes",
    bank:"UECE", institution:"UECE", year:2007, difficulty:"Média",
    statement:"Dois fios retilíneos muito longos atravessam perpendicularmente o plano do papel e conduzem correntes de sentidos opostos, i₁ e i₂. O fio 1 está a uma distância 2d do ponto P, e o fio 2 está a uma distância d de P. Qual condição torna nulo o campo magnético resultante em P?",
    image:"/questoes/imagens/fios-uece.svg",
    imageAlt:"Dois fios perpendiculares ao papel em uma linha horizontal. A distância entre cada fio e seus vizinhos é d; o segundo fio está a distância d de P e o primeiro a 2d de P.",
    choices:[
      {letter:"A",text:"i₁ = i₂"},
      {letter:"B",text:"i₁ = 2i₂"},
      {letter:"C",text:"i₁ = 3i₂"}
    ],
    correct:"B",
    solution:"Para um fio retilíneo longo, B = μ₀I/(2πr). Em P, os campos têm sentidos opostos porque as correntes são opostas. Igualando os módulos: μ₀i₁/[2π(2d)] = μ₀i₂/(2πd). Portanto, i₁/2 = i₂ e i₁ = 2i₂.",
    source:"UECE, 2007 — questão apresentada na imagem enviada pelo responsável pelo site.",
    license:"Enunciado reescrito e diagrama redesenhado para uso didático; manter a atribuição e confirmar a autorização de publicação da questão original.",
    simulation:"/laboratorio-magnetismo/",
    tags:["fios","regra da mão direita","campo magnético","corrente elétrica"]
  },
  {
    id:"lei-faraday-bobina-ima",
    title:"Variação de fluxo em uma bobina",
    discipline:"Física", subject:"Eletromagnetismo", subtopic:"Indução eletromagnética",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Uma bobina está ligada a um galvanômetro. Um ímã é movimentado para dentro dela e depois mantido parado no interior. Em que situação surge corrente induzida na bobina?",
    choices:[
      {letter:"A",text:"Enquanto o fluxo magnético através da bobina varia durante o movimento do ímã."},
      {letter:"B",text:"Somente quando o ímã fica parado dentro da bobina."},
      {letter:"C",text:"Em nenhum momento, pois a bobina não tem bateria."},
      {letter:"D",text:"Apenas quando a bobina é retirada do circuito."},
      {letter:"E",text:"Enquanto o campo magnético permanece constante."}
    ],
    correct:"A",
    solution:"A lei de Faraday relaciona a força eletromotriz induzida à taxa de variação do fluxo magnético. O movimento relativo do ímã altera o fluxo e induz corrente. Quando o ímã fica parado e o fluxo deixa de variar, a corrente induzida cessa.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral.",
    simulation:"/laboratorio-magnetismo/"
  },
  {
    id:"mru-posicao-tempo",
    title:"Posição de um ciclista em movimento uniforme",
    discipline:"Física", subject:"Cinemática", subtopic:"Movimento Retilíneo Uniforme (MRU)",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Um ciclista parte da posição x₀ = 5 m e mantém velocidade constante de 3 m/s no sentido positivo da trajetória. Em que posição ele estará após 4 s?",
    choices:[{letter:"A",text:"8 m"},{letter:"B",text:"12 m"},{letter:"C",text:"17 m"},{letter:"D",text:"20 m"},{letter:"E",text:"23 m"}],
    correct:"C",
    solution:"No MRU, x = x₀ + vt. Substituindo os valores: x = 5 + 3·4 = 17 m. A posição inicial também deve entrar no cálculo.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"mruv-velocidade-final",
    title:"Velocidade final de um carrinho",
    discipline:"Física", subject:"Cinemática", subtopic:"Movimento Retilíneo Uniformemente Variado (MRUV)",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Um carrinho tem velocidade inicial de 4 m/s e acelera a 2 m/s² durante 3 s. Qual é sua velocidade ao final desse intervalo?",
    choices:[{letter:"A",text:"6 m/s"},{letter:"B",text:"8 m/s"},{letter:"C",text:"10 m/s"},{letter:"D",text:"12 m/s"},{letter:"E",text:"14 m/s"}],
    correct:"C",
    solution:"No MRUV, v = v₀ + at. Logo, v = 4 + 2·3 = 10 m/s. A aceleração positiva aumenta a velocidade nesse sentido.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral.", simulation:"/laboratorio-mruv/"
  },
  {
    id:"segunda-lei-newton",
    title:"Força resultante sobre um bloco",
    discipline:"Física", subject:"Dinâmica", subtopic:"Leis de Newton",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Uma força resultante horizontal de 10 N atua sobre um bloco de massa 2 kg. Desprezando outras forças horizontais, qual é a aceleração do bloco?",
    choices:[{letter:"A",text:"2 m/s²"},{letter:"B",text:"5 m/s²"},{letter:"C",text:"10 m/s²"},{letter:"D",text:"12 m/s²"},{letter:"E",text:"20 m/s²"}],
    correct:"B",
    solution:"Pela segunda lei de Newton, Fᵣ = ma. Assim, a = Fᵣ/m = 10/2 = 5 m/s².",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral.", simulation:"/laboratorio-mruv/"
  },
  {
    id:"acao-reacao-patins",
    title:"Ação e reação em patins",
    discipline:"Física", subject:"Dinâmica", subtopic:"Terceira lei de Newton",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Duas pessoas em patins se empurram e começam a se afastar. Durante o empurrão, como se relacionam as forças que uma exerce sobre a outra?",
    choices:[{letter:"A",text:"A pessoa mais pesada exerce a força maior."},{letter:"B",text:"A força sobre cada pessoa tem o mesmo módulo e o mesmo sentido."},{letter:"C",text:"As forças têm o mesmo módulo e sentidos opostos, e atuam em corpos diferentes."},{letter:"D",text:"Só existe força sobre quem começa a se mover."},{letter:"E",text:"As forças aparecem apenas depois que as pessoas se afastam."}],
    correct:"C",
    solution:"Pela terceira lei de Newton, as forças de interação têm o mesmo módulo e sentidos opostos. Elas atuam em corpos diferentes, por isso não se cancelam no diagrama de forças de uma única pessoa.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"atrito-caixa",
    title:"Atrito em uma caixa puxada no chão",
    discipline:"Física", subject:"Dinâmica", subtopic:"Força de atrito",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Uma caixa desliza para a direita sobre um piso horizontal. Qual é o sentido da força de atrito cinético exercida pelo piso sobre a caixa?",
    choices:[{letter:"A",text:"Para a direita, no mesmo sentido do movimento."},{letter:"B",text:"Para a esquerda, contrário ao deslizamento relativo."},{letter:"C",text:"Vertical para cima."},{letter:"D",text:"Vertical para baixo."},{letter:"E",text:"Nulo em qualquer situação."}],
    correct:"B",
    solution:"O atrito cinético se opõe ao movimento relativo entre as superfícies em contato. Como a caixa desliza para a direita em relação ao piso, o atrito sobre ela aponta para a esquerda.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"energia-potencial-gravitacional",
    title:"Energia potencial em uma prateleira",
    discipline:"Física", subject:"Trabalho e Energia", subtopic:"Energia potencial gravitacional",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Uma caixa de 2 kg está a 3 m do chão. Adote g = 10 m/s² e o chão como nível de energia potencial nula. Qual é a energia potencial gravitacional da caixa?",
    choices:[{letter:"A",text:"6 J"},{letter:"B",text:"15 J"},{letter:"C",text:"30 J"},{letter:"D",text:"60 J"},{letter:"E",text:"90 J"}],
    correct:"D",
    solution:"A energia potencial gravitacional é Eₚ = mgh. Logo, Eₚ = 2·10·3 = 60 J.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"energia-cinetica-skate",
    title:"Energia cinética de um skate",
    discipline:"Física", subject:"Trabalho e Energia", subtopic:"Energia cinética",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Um conjunto de massa 4 kg move-se a 3 m/s. Qual é sua energia cinética?",
    choices:[{letter:"A",text:"6 J"},{letter:"B",text:"12 J"},{letter:"C",text:"18 J"},{letter:"D",text:"24 J"},{letter:"E",text:"36 J"}],
    correct:"C",
    solution:"E꜀ = mv²/2. Substituindo: E꜀ = 4·3²/2 = 36/2 = 18 J.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"pressao-ponta",
    title:"Pressão exercida por um êmbolo",
    discipline:"Física", subject:"Hidrostática", subtopic:"Pressão",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Um êmbolo aplica uma força perpendicular de 200 N sobre uma área de 0,01 m². Qual pressão média é transmitida?",
    choices:[{letter:"A",text:"20 Pa"},{letter:"B",text:"200 Pa"},{letter:"C",text:"2 000 Pa"},{letter:"D",text:"20 000 Pa"},{letter:"E",text:"200 000 Pa"}],
    correct:"D",
    solution:"A pressão é p = F/A. Então, p = 200/0,01 = 20 000 Pa, ou 20 kPa.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"empuxo-bloco-agua",
    title:"Empuxo sobre um bloco submerso",
    discipline:"Física", subject:"Hidrostática", subtopic:"Princípio de Arquimedes",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Um bloco totalmente submerso desloca 0,002 m³ de água. Use a densidade da água 1 000 kg/m³ e g = 10 m/s². Qual é o empuxo sobre o bloco?",
    choices:[{letter:"A",text:"2 N"},{letter:"B",text:"10 N"},{letter:"C",text:"20 N"},{letter:"D",text:"200 N"},{letter:"E",text:"2 000 N"}],
    correct:"C",
    solution:"O empuxo é igual ao peso do fluido deslocado: E = ρgV. Assim, E = 1 000·10·0,002 = 20 N, dirigido para cima.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"calor-agua",
    title:"Aquecimento de água",
    discipline:"Física", subject:"Termologia", subtopic:"Calor sensível",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"São fornecidos 20 000 J a 0,5 kg de água. Considere calor específico c = 4 000 J/(kg·°C) e despreze perdas. Qual é a variação de temperatura?",
    choices:[{letter:"A",text:"1 °C"},{letter:"B",text:"5 °C"},{letter:"C",text:"10 °C"},{letter:"D",text:"20 °C"},{letter:"E",text:"40 °C"}],
    correct:"C",
    solution:"Q = mcΔT. Portanto, ΔT = Q/(mc) = 20 000/(0,5·4 000) = 10 °C.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"primeira-lei-termodinamica",
    title:"Energia interna de um gás",
    discipline:"Física", subject:"Termodinâmica", subtopic:"Primeira lei da Termodinâmica",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Um gás recebe 300 J de calor e realiza 100 J de trabalho sobre o ambiente. Pela convenção ΔU = Q − W, qual é a variação de sua energia interna?",
    choices:[{letter:"A",text:"−400 J"},{letter:"B",text:"−200 J"},{letter:"C",text:"100 J"},{letter:"D",text:"200 J"},{letter:"E",text:"400 J"}],
    correct:"D",
    solution:"Pela primeira lei, ΔU = Q − W. Como Q = 300 J e o gás realiza W = 100 J, ΔU = 300 − 100 = 200 J. A energia interna aumenta.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"velocidade-onda-corda",
    title:"Velocidade de propagação de uma onda",
    discipline:"Física", subject:"Ondulatória", subtopic:"Velocidade, frequência e comprimento de onda",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Uma onda periódica tem comprimento de onda 0,8 m e frequência 5 Hz. Qual é sua velocidade de propagação?",
    choices:[{letter:"A",text:"0,16 m/s"},{letter:"B",text:"1,6 m/s"},{letter:"C",text:"4 m/s"},{letter:"D",text:"5,8 m/s"},{letter:"E",text:"6,25 m/s"}],
    correct:"C",
    solution:"A velocidade de onda é v = λf. Logo, v = 0,8·5 = 4 m/s.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"doppler-fonte-aproxima",
    title:"Efeito Doppler com fonte em aproximação",
    discipline:"Física", subject:"Ondulatória", subtopic:"Efeito Doppler",
    bank:"", institution:"", year:null, difficulty:"Difícil",
    statement:"Uma sirene emite som de 900 Hz e se aproxima de um observador parado a 34 m/s. Considere a velocidade do som igual a 340 m/s e despreze o vento. Qual frequência o observador percebe?",
    choices:[{letter:"A",text:"810 Hz"},{letter:"B",text:"900 Hz"},{letter:"C",text:"950 Hz"},{letter:"D",text:"1 000 Hz"},{letter:"E",text:"1 034 Hz"}],
    correct:"D",
    solution:"Para uma fonte que se aproxima de observador parado, f' = f·v/(v − vₛ). Assim, f' = 900·340/(340−34) = 306 000/306 = 1 000 Hz. A frequência percebida aumenta.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"espelho-plano-distancia",
    title:"Imagem em um espelho plano",
    discipline:"Física", subject:"Óptica", subtopic:"Espelhos planos",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Uma estudante fica a 2 m de um espelho plano. Qual é a distância entre ela e sua imagem virtual?",
    choices:[{letter:"A",text:"1 m"},{letter:"B",text:"2 m"},{letter:"C",text:"3 m"},{letter:"D",text:"4 m"},{letter:"E",text:"8 m"}],
    correct:"D",
    solution:"A imagem fica à mesma distância atrás do espelho que o objeto está à frente. A separação entre estudante e imagem é 2 m + 2 m = 4 m.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral.", simulation:"/laboratorio-espelhos/"
  },
  {
    id:"lei-snell-vidro",
    title:"Refração da luz do ar para o vidro",
    discipline:"Física", subject:"Óptica", subtopic:"Lei de Snell",
    bank:"", institution:"", year:null, difficulty:"Difícil",
    statement:"Um raio passa do ar (n₁ = 1) para um vidro (n₂ = 1,5) com ângulo de incidência de 30° em relação à normal. Qual é aproximadamente o seno do ângulo de refração?",
    choices:[{letter:"A",text:"1/6"},{letter:"B",text:"1/3"},{letter:"C",text:"1/2"},{letter:"D",text:"2/3"},{letter:"E",text:"3/2"}],
    correct:"B",
    solution:"Pela lei de Snell, n₁sen(i) = n₂sen(r). Então sen(r) = (1·sen 30°)/1,5 = 0,5/1,5 = 1/3. A luz se aproxima da normal ao entrar no meio de maior índice.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"lei-coulomb-cargas",
    title:"Força elétrica entre duas cargas",
    discipline:"Física", subject:"Eletrostática", subtopic:"Lei de Coulomb",
    bank:"", institution:"", year:null, difficulty:"Difícil",
    statement:"Duas cargas puntiformes iguais, de 2 μC cada, estão separadas por 0,30 m no vácuo. Use k = 9×10⁹ N·m²/C². Qual é o módulo da força elétrica entre elas?",
    choices:[{letter:"A",text:"0,04 N"},{letter:"B",text:"0,4 N"},{letter:"C",text:"4 N"},{letter:"D",text:"40 N"},{letter:"E",text:"400 N"}],
    correct:"B",
    solution:"Pela lei de Coulomb, F = k|q₁q₂|/r². Com q = 2×10⁻⁶ C: F = 9×10⁹·4×10⁻¹²/0,09 = 0,036/0,09 = 0,4 N. Como as cargas têm mesmo sinal, a força é repulsiva.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"lei-ohm-resistor",
    title:"Corrente em um resistor",
    discipline:"Física", subject:"Eletrodinâmica", subtopic:"Primeira lei de Ohm",
    bank:"", institution:"", year:null, difficulty:"Fácil",
    statement:"Um resistor de 4 Ω está submetido a uma tensão de 12 V. Considerando-o ôhmico, qual corrente o atravessa?",
    choices:[{letter:"A",text:"0,3 A"},{letter:"B",text:"2 A"},{letter:"C",text:"3 A"},{letter:"D",text:"8 A"},{letter:"E",text:"48 A"}],
    correct:"C",
    solution:"Pela lei de Ohm, U = Ri. Assim, i = U/R = 12/4 = 3 A.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral.", simulation:"/laboratorio-magnetismo/"
  },
  {
    id:"resistores-serie",
    title:"Resistores ligados em série",
    discipline:"Física", subject:"Eletrodinâmica", subtopic:"Associação de resistores",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Três resistores de 2 Ω, 4 Ω e 6 Ω são ligados em série a uma fonte ideal de 24 V. Qual corrente percorre o circuito?",
    choices:[{letter:"A",text:"0,5 A"},{letter:"B",text:"1 A"},{letter:"C",text:"2 A"},{letter:"D",text:"4 A"},{letter:"E",text:"12 A"}],
    correct:"C",
    solution:"Em série, a resistência equivalente é a soma: Rₑq = 2 + 4 + 6 = 12 Ω. A corrente é i = U/Rₑq = 24/12 = 2 A.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  },
  {
    id:"gravidade-distancia",
    title:"Como a gravitação depende da distância",
    discipline:"Física", subject:"Gravitação", subtopic:"Lei da gravitação universal",
    bank:"", institution:"", year:null, difficulty:"Média",
    statement:"Mantendo duas massas fixas, a distância entre seus centros é multiplicada por 2. O que acontece com o módulo da força gravitacional entre elas?",
    choices:[{letter:"A",text:"Fica duas vezes maior."},{letter:"B",text:"Fica quatro vezes maior."},{letter:"C",text:"Não muda."},{letter:"D",text:"Cai à metade."},{letter:"E",text:"Cai a um quarto."}],
    correct:"E",
    solution:"A lei da gravitação contém a dependência F ∝ 1/r². Se a distância dobra, a força passa a F/2² = F/4.",
    source:"Questão autoral — Diário dos BNs.", license:"Conteúdo autoral."
  }
];

