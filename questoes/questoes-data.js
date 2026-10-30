/* Banco de questões didáticas autorais, adaptadas e com fontes identificadas. */
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
,
  {
    "id": "cometa-ioaa-2007-periodo-kepler",
    "title": "Período orbital a partir dos extremos da órbita",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2007,
    "difficulty": "Difícil",
    "statement": "Um cometa ligado gravitacionalmente ao Sol tem periélio de 0,5 UA e afélio de 31,5 UA. Adote T² = a³, com T em anos e a em UA. Qual é aproximadamente seu período orbital?",
    "choices": [
      {
        "letter": "A",
        "text": "32 anos"
      },
      {
        "letter": "B",
        "text": "48 anos"
      },
      {
        "letter": "C",
        "text": "56 anos"
      },
      {
        "letter": "D",
        "text": "64 anos"
      },
      {
        "letter": "E",
        "text": "80 anos"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "IOAA 2007, problema de mecânica celeste sobre o período de um cometa; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Kepler",
      "período orbital"
    ]
  },
  {
    "id": "cometa-ioaa-2007-area-kepler",
    "title": "Área varrida pelo raio vetor do cometa",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2007,
    "difficulty": "Difícil",
    "statement": "Para o cometa com periélio 0,5 UA e afélio 31,5 UA, a órbita tem período de 64 anos. Usando a segunda lei de Kepler, qual é aproximadamente a área varrida pelo segmento que liga o Sol ao cometa em um ano?",
    "choices": [
      {
        "letter": "A",
        "text": "0,8 UA²"
      },
      {
        "letter": "B",
        "text": "1,6 UA²"
      },
      {
        "letter": "C",
        "text": "3,1 UA²"
      },
      {
        "letter": "D",
        "text": "6,3 UA²"
      },
      {
        "letter": "E",
        "text": "9,9 UA²"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "IOAA 2007, problema de mecânica celeste sobre a área varrida por unidade de tempo; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Kepler",
      "áreas iguais"
    ]
  },
  {
    "id": "cometa-ioaa-2007-semieixo-maior",
    "title": "Semieixo maior da órbita cometária",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2007,
    "difficulty": "Média",
    "statement": "Um cometa alcança 0,5 UA no periélio e 31,5 UA no afélio. Qual é o semieixo maior da órbita elíptica?",
    "choices": [
      {
        "letter": "A",
        "text": "8 UA"
      },
      {
        "letter": "B",
        "text": "15,5 UA"
      },
      {
        "letter": "C",
        "text": "16 UA"
      },
      {
        "letter": "D",
        "text": "31,5 UA"
      },
      {
        "letter": "E",
        "text": "32 UA"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação didática baseada no problema de órbita cometária da IOAA 2007; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "elipse",
      "semieixo maior"
    ]
  },
  {
    "id": "cometa-ioaa-2007-excentricidade",
    "title": "Excentricidade de uma órbita de cometa",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2007,
    "difficulty": "Difícil",
    "statement": "Um cometa tem distância periélica q = 0,5 UA e afélica Q = 31,5 UA. Pela relação e = (Q − q)/(Q + q), qual é aproximadamente a excentricidade da órbita?",
    "choices": [
      {
        "letter": "A",
        "text": "0,031"
      },
      {
        "letter": "B",
        "text": "0,250"
      },
      {
        "letter": "C",
        "text": "0,500"
      },
      {
        "letter": "D",
        "text": "0,938"
      },
      {
        "letter": "E",
        "text": "0,969"
      }
    ],
    "correct": "E",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação didática baseada no problema de órbita cometária da IOAA 2007; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "excentricidade",
      "elipse"
    ]
  },
  {
    "id": "cometa-ioaa-2007-segunda-lei",
    "title": "Velocidade e segunda lei de Kepler",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2007,
    "difficulty": "Média",
    "statement": "Durante intervalos de tempo iguais, o segmento Sol–cometa varre áreas iguais. O que isso implica para a velocidade orbital de um cometa em uma órbita elíptica?",
    "choices": [
      {
        "letter": "A",
        "text": "A velocidade é constante em toda a órbita."
      },
      {
        "letter": "B",
        "text": "A velocidade é menor no periélio."
      },
      {
        "letter": "C",
        "text": "A velocidade é maior no periélio e menor no afélio."
      },
      {
        "letter": "D",
        "text": "A velocidade é zero no afélio."
      },
      {
        "letter": "E",
        "text": "A velocidade depende apenas da massa do cometa."
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação conceitual da questão de áreas orbitais da IOAA 2007; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Kepler",
      "velocidade orbital"
    ]
  },
  {
    "id": "cometa-ioaa-2011-tempo-nuvem-oort",
    "title": "Tempo de queda desde a Nuvem de Oort",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2011,
    "difficulty": "Difícil",
    "statement": "Um cometa está no afélio a cerca de 35 000 UA do Sol e segue para uma região interna cuja distância ao Sol é pequena diante desse valor. Usando T² = a³ e supondo que o trajeto do afélio ao periélio corresponde a aproximadamente metade do período, estime o tempo de viagem.",
    "choices": [
      {
        "letter": "A",
        "text": "1,2 mil anos"
      },
      {
        "letter": "B",
        "text": "1,2 milhão de anos"
      },
      {
        "letter": "C",
        "text": "2,3 milhões de anos"
      },
      {
        "letter": "D",
        "text": "35 mil anos"
      },
      {
        "letter": "E",
        "text": "70 mil anos"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "IOAA 2011, problema de estimativa do tempo de viagem de cometas vindos da Nuvem de Oort; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Nuvem de Oort",
      "Kepler"
    ]
  },
  {
    "id": "cometa-ioaa-2011-periodo-nuvem-oort",
    "title": "Período de um cometa vindo da Nuvem de Oort",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "IOAA (adaptada)",
    "institution": "Olimpíada Internacional de Astronomia e Astrofísica",
    "year": 2011,
    "difficulty": "Difícil",
    "statement": "Considere um cometa com afélio próximo de 35 000 UA e periélio muito menor que essa distância. Pela aproximação a ≈ Q/2 e pela terceira lei de Kepler, qual é a ordem de grandeza do período completo?",
    "choices": [
      {
        "letter": "A",
        "text": "2,3 × 10³ anos"
      },
      {
        "letter": "B",
        "text": "2,3 × 10⁴ anos"
      },
      {
        "letter": "C",
        "text": "2,3 × 10⁵ anos"
      },
      {
        "letter": "D",
        "text": "2,3 × 10⁶ anos"
      },
      {
        "letter": "E",
        "text": "3,5 × 10⁷ anos"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação didática do problema da Nuvem de Oort da IOAA 2011; enunciado reescrito.",
    "sourceUrl": "https://ioaastrophysics.org/resources/problems-from-past-ioaa",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Nuvem de Oort",
      "período orbital"
    ]
  },
  {
    "id": "cometa-oba-2025-identificar-perielio",
    "title": "Localização do periélio em uma elipse",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2025,
    "difficulty": "Fácil",
    "statement": "Em um esquema de uma órbita elíptica, o Sol está no foco F. Quatro posições possíveis do cometa estão a estas distâncias de F: A = 3,2 UA; B = 2,0 UA; C = 0,8 UA; D = 1,4 UA. Em qual posição está o periélio?",
    "choices": [
      {
        "letter": "A",
        "text": "A"
      },
      {
        "letter": "B",
        "text": "B"
      },
      {
        "letter": "C",
        "text": "C"
      },
      {
        "letter": "D",
        "text": "D"
      },
      {
        "letter": "E",
        "text": "Não é possível determinar sem conhecer a massa do cometa."
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBA 2025, nível 2, questão sobre identificação de periélio e afélio em uma órbita; dados e enunciado reescritos.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/downloads/Prova%20nivel%202%20da%2028%20OBA%20DE%202025_compressed.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "periélio",
      "afélio",
      "órbita elíptica"
    ]
  },
  {
    "id": "cometa-oba-2025-velocidade-forca",
    "title": "O que ocorre no periélio?",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2025,
    "difficulty": "Fácil",
    "statement": "Um cometa percorre uma órbita elíptica ao redor do Sol. Comparando o periélio com o afélio, qual alternativa descreve corretamente a velocidade do cometa e o módulo da força gravitacional solar?",
    "choices": [
      {
        "letter": "A",
        "text": "Ambos são mínimos no periélio."
      },
      {
        "letter": "B",
        "text": "Ambos são máximos no periélio."
      },
      {
        "letter": "C",
        "text": "A velocidade é máxima e a força é mínima no periélio."
      },
      {
        "letter": "D",
        "text": "A velocidade é mínima e a força é máxima no periélio."
      },
      {
        "letter": "E",
        "text": "Ambos permanecem constantes."
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação da questão de órbita cometária da OBA 2025, nível 2; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/downloads/Prova%20nivel%202%20da%2028%20OBA%20DE%202025_compressed.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "periélio",
      "gravitação",
      "velocidade orbital"
    ]
  },
  {
    "id": "cometa-oba-2025-sol-foco",
    "title": "Onde fica o Sol na órbita elíptica?",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2025,
    "difficulty": "Fácil",
    "statement": "Uma ilustração mostra a trajetória elíptica de um cometa. Para representar corretamente a primeira lei de Kepler, onde deve ser colocado o Sol?",
    "choices": [
      {
        "letter": "A",
        "text": "No centro geométrico da elipse, em todos os casos."
      },
      {
        "letter": "B",
        "text": "Em um dos focos da elipse."
      },
      {
        "letter": "C",
        "text": "Sobre a borda da elipse."
      },
      {
        "letter": "D",
        "text": "Fora do plano da órbita."
      },
      {
        "letter": "E",
        "text": "A posição depende do sentido de movimento."
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação conceitual da questão de órbita cometária da OBA 2025, nível 2; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/downloads/Prova%20nivel%202%20da%2028%20OBA%20DE%202025_compressed.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Kepler",
      "elipse"
    ]
  },
  {
    "id": "cometa-oba-2024-periodo-observacoes",
    "title": "Estimativa de período por aparições sucessivas",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Registros de um cometa periódico mostram aparições em 1944, 1969, 1994 e 2019. Qual é o período orbital sugerido por esses dados?",
    "choices": [
      {
        "letter": "A",
        "text": "15 anos"
      },
      {
        "letter": "B",
        "text": "25 anos"
      },
      {
        "letter": "C",
        "text": "40 anos"
      },
      {
        "letter": "D",
        "text": "65 anos"
      },
      {
        "letter": "E",
        "text": "75 anos"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBA 2024, nível 4, questão baseada em aparições espaçadas por décadas; dados apresentados em forma textual.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "período orbital",
      "cometa periódico"
    ]
  },
  {
    "id": "cometa-oba-2024-semieixo-kepler",
    "title": "Semieixo maior para um cometa de 25 anos",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Um cometa tem período orbital de 25 anos. Usando T² = a³, com T em anos e a em UA, qual é aproximadamente o semieixo maior da órbita?",
    "choices": [
      {
        "letter": "A",
        "text": "4,6 UA"
      },
      {
        "letter": "B",
        "text": "6,3 UA"
      },
      {
        "letter": "C",
        "text": "8,5 UA"
      },
      {
        "letter": "D",
        "text": "12,5 UA"
      },
      {
        "letter": "E",
        "text": "25 UA"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação autoral baseada na questão de período de cometa da OBA 2024, nível 4; enunciado reescrito.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Kepler",
      "semieixo maior"
    ]
  },
  {
    "id": "cometa-oba-2024-curto-periodo",
    "title": "Classificação de cometa periódico",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Em uma questão da OBA, cometas de curto período são descritos como aqueles com período orbital inferior a 200 anos. Um cometa que retorna a cada 25 anos se enquadra em qual classificação?",
    "choices": [
      {
        "letter": "A",
        "text": "Cometa de longo período."
      },
      {
        "letter": "B",
        "text": "Objeto interestelar."
      },
      {
        "letter": "C",
        "text": "Cometa de curto período."
      },
      {
        "letter": "D",
        "text": "Asteroide sem órbita solar."
      },
      {
        "letter": "E",
        "text": "Satélite natural."
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBA 2024, nível 4, questão sobre cometas periódicos e período orbital; enunciado reescrito.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "cometa periódico",
      "classificação"
    ]
  },
  {
    "id": "cometa-oba-2024-plano-orbital",
    "title": "Órbita típica de cometas de curto período",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Qual afirmação corresponde a uma tendência geral, e não a uma regra sem exceções, para cometas de curto período?",
    "choices": [
      {
        "letter": "A",
        "text": "Muitos orbitam aproximadamente no plano da eclíptica e no mesmo sentido geral dos planetas."
      },
      {
        "letter": "B",
        "text": "Todos orbitam exatamente no plano da eclíptica."
      },
      {
        "letter": "C",
        "text": "Todos têm órbitas circulares."
      },
      {
        "letter": "D",
        "text": "Todos orbitam em sentido retrógrado."
      },
      {
        "letter": "E",
        "text": "Nenhum passa perto do Sol."
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação da questão sobre cometas de curto período da OBA 2024, nível 4; enunciado reescrito.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "eclíptica",
      "órbita"
    ]
  },
  {
    "id": "cometa-oba-treino-gelo-sublimacao",
    "title": "Gelo de água em um pequeno corpo distante",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (treino adaptado)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": null,
    "difficulty": "Média",
    "statement": "Para este modelo didático, use T = 278/√r, em que T é a temperatura de equilíbrio em kelvins e r a distância ao Sol em UA. Se o gelo de água começa a sublimar significativamente acima de 150 K, o que ocorre a 4 UA?",
    "choices": [
      {
        "letter": "A",
        "text": "T ≈ 556 K; o gelo permanece sólido."
      },
      {
        "letter": "B",
        "text": "T ≈ 278 K; o gelo sublima rapidamente."
      },
      {
        "letter": "C",
        "text": "T ≈ 139 K; a temperatura fica abaixo do limiar adotado para sublimação."
      },
      {
        "letter": "D",
        "text": "T ≈ 150 K; a temperatura é independente da distância."
      },
      {
        "letter": "E",
        "text": "T ≈ 70 K; a temperatura supera o limiar."
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral de treino baseada em temas de corpos pequenos e aquecimento solar presentes em olimpíadas de astronomia.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "sublimação",
      "temperatura",
      "gelo"
    ]
  },
  {
    "id": "cometa-oba-2005-halley-excentricidade",
    "title": "A excentricidade da órbita do cometa Halley",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2005,
    "difficulty": "Média",
    "statement": "A órbita do cometa Halley tem excentricidade aproximada de 0,967. O que esse valor indica sobre a órbita?",
    "choices": [
      {
        "letter": "A",
        "text": "É praticamente circular."
      },
      {
        "letter": "B",
        "text": "É uma elipse bastante alongada."
      },
      {
        "letter": "C",
        "text": "É uma parábola com excentricidade exatamente 1."
      },
      {
        "letter": "D",
        "text": "É uma órbita espiral."
      },
      {
        "letter": "E",
        "text": "É uma reta."
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBA 2005, nível 3, questão sobre a excentricidade da órbita do cometa Halley; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/Prova%20nivel%203%20da%20VIII%20OBA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Halley",
      "excentricidade",
      "elipse"
    ]
  },
  {
    "id": "cometa-oba-2022-leonard-periodo",
    "title": "Cometa Leonard e período orbital",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA Online (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2022,
    "difficulty": "Fácil",
    "statement": "Uma questão da OBA sobre C/2021 A1 (Leonard) informa um período orbital de cerca de 80 000 anos. Como esse período deve ser classificado?",
    "choices": [
      {
        "letter": "A",
        "text": "Muito curto."
      },
      {
        "letter": "B",
        "text": "Curto, menor que 20 anos."
      },
      {
        "letter": "C",
        "text": "Médio, de algumas dezenas de anos."
      },
      {
        "letter": "D",
        "text": "Longo."
      },
      {
        "letter": "E",
        "text": "Não periódico por definição."
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBA Online 2022, questão sobre C/2021 A1 Leonard e sua órbita; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/P2%2025nov.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Leonard",
      "período orbital"
    ]
  },
  {
    "id": "cometa-oba-2022-leonard-semieixo",
    "title": "Semieixo maior estimado pelo período de Leonard",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA Online (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2022,
    "difficulty": "Difícil",
    "statement": "Considere o período aproximado de 80 000 anos atribuído ao cometa C/2021 A1 (Leonard). No modelo T² = a³, com T em anos e a em UA, qual é a ordem de grandeza de seu semieixo maior?",
    "choices": [
      {
        "letter": "A",
        "text": "1,9 UA"
      },
      {
        "letter": "B",
        "text": "19 UA"
      },
      {
        "letter": "C",
        "text": "190 UA"
      },
      {
        "letter": "D",
        "text": "1,9 × 10³ UA"
      },
      {
        "letter": "E",
        "text": "8,0 × 10⁴ UA"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação de cálculo baseada nos dados orbitais do cometa Leonard apresentados na OBA Online 2022; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/P2%2025nov.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Leonard",
      "Kepler",
      "semieixo maior"
    ]
  },
  {
    "id": "cometa-oba-2022-retrogrado",
    "title": "O significado de órbita retrógrada",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA Online (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2022,
    "difficulty": "Fácil",
    "statement": "Uma questão da OBA descreve o cometa Leonard como retrógrado. Em relação ao sentido orbital usual dos planetas, isso significa que o cometa:",
    "choices": [
      {
        "letter": "A",
        "text": "Move-se ao redor do Sol no sentido oposto ao sentido direto de referência."
      },
      {
        "letter": "B",
        "text": "Está necessariamente se afastando do Sol."
      },
      {
        "letter": "C",
        "text": "Não sofre atração gravitacional solar."
      },
      {
        "letter": "D",
        "text": "Move-se em linha reta e não retornará."
      },
      {
        "letter": "E",
        "text": "Gira em torno da Terra."
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBA Online 2022, questão sobre a órbita retrógrada de C/2021 A1 Leonard; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/P2%2025nov.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Leonard",
      "órbita retrógrada"
    ]
  },
  {
    "id": "cometa-oba-2022-mapa-celeste",
    "title": "Movimento do cometa em relação às estrelas",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA Online (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2022,
    "difficulty": "Média",
    "statement": "Em cartas celestes de noites sucessivas, a posição de um cometa muda em relação às estrelas de fundo. Qual conclusão é compatível com essa observação?",
    "choices": [
      {
        "letter": "A",
        "text": "O cometa está fixo às estrelas e a carta está necessariamente errada."
      },
      {
        "letter": "B",
        "text": "O deslocamento aparente permite acompanhar o movimento do cometa no céu."
      },
      {
        "letter": "C",
        "text": "As estrelas estão orbitando o cometa."
      },
      {
        "letter": "D",
        "text": "A mudança prova que o cometa deixou de orbitar o Sol."
      },
      {
        "letter": "E",
        "text": "O movimento aparente mede diretamente a massa do cometa."
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação da questão de observação da trajetória de C/2021 A1 Leonard na OBA Online 2022; enunciado reescrito.",
    "sourceUrl": "https://sistema.oba.org.br/sisglob/sisglob_arquivos/P2%2025nov.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "Leonard",
      "observação",
      "carta celeste"
    ]
  },
  {
    "id": "cometa-oboa-2025-velocidade-afelio",
    "title": "Velocidade no afélio pela conservação do momento angular",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBOA (adaptada)",
    "institution": "Olimpíada Brasileira Online de Astronomia",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Em uma órbita elíptica, um cometa passa pelo periélio a 0,6 UA do Sol com velocidade tangencial de 42 km/s. No afélio, está a 4,2 UA. Usando a conservação do momento angular nos extremos da órbita, qual é sua velocidade no afélio?",
    "choices": [
      {
        "letter": "A",
        "text": "3 km/s"
      },
      {
        "letter": "B",
        "text": "6 km/s"
      },
      {
        "letter": "C",
        "text": "12 km/s"
      },
      {
        "letter": "D",
        "text": "21 km/s"
      },
      {
        "letter": "E",
        "text": "42 km/s"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "OBOA 2025, questão 18, sobre velocidade em periélio e afélio; valores e enunciado adaptados.",
    "sourceUrl": "https://noic.com.br/wp-content/uploads/2025/08/OBOA_Fund_2025.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "momento angular",
      "periélio",
      "afélio"
    ]
  },
  {
    "id": "cometa-oboa-2025-excentricidade",
    "title": "Excentricidade a partir das distâncias extremas",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBOA (adaptada)",
    "institution": "Olimpíada Brasileira Online de Astronomia",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Um cometa tem periélio q = 0,6 UA e afélio Q = 4,2 UA. Calcule a excentricidade pela relação e = (Q − q)/(Q + q).",
    "choices": [
      {
        "letter": "A",
        "text": "0,25"
      },
      {
        "letter": "B",
        "text": "0,50"
      },
      {
        "letter": "C",
        "text": "0,60"
      },
      {
        "letter": "D",
        "text": "0,75"
      },
      {
        "letter": "E",
        "text": "0,90"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação autoral baseada na questão 18 da OBOA 2025 sobre a órbita elíptica de um cometa.",
    "sourceUrl": "https://noic.com.br/wp-content/uploads/2025/08/OBOA_Fund_2025.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "excentricidade",
      "elipse"
    ]
  },
  {
    "id": "cometa-oboa-2025-razao-forca",
    "title": "Força gravitacional no periélio e no afélio",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBOA (adaptada)",
    "institution": "Olimpíada Brasileira Online de Astronomia",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Um cometa tem periélio a 0,6 UA e afélio a 4,2 UA. Desprezando outros corpos, qual é a razão entre a força gravitacional solar no periélio e a força no afélio?",
    "choices": [
      {
        "letter": "A",
        "text": "7"
      },
      {
        "letter": "B",
        "text": "14"
      },
      {
        "letter": "C",
        "text": "21"
      },
      {
        "letter": "D",
        "text": "49"
      },
      {
        "letter": "E",
        "text": "343"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Variação autoral baseada na questão de órbita cometária da OBOA 2025; distâncias e enunciado reescritos.",
    "sourceUrl": "https://noic.com.br/wp-content/uploads/2025/08/OBOA_Fund_2025.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "gravitação",
      "periélio",
      "afélio"
    ]
  },
  {
    "id": "cometa-oba-2024-coma-cauda",
    "title": "Formação da coma e da cauda",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA Online (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Quando um cometa se aproxima do Sol, sua coma e sua cauda podem se tornar mais evidentes. Qual processo explica principalmente a liberação de gás e poeira do núcleo?",
    "choices": [
      {
        "letter": "A",
        "text": "A fusão nuclear no núcleo do cometa."
      },
      {
        "letter": "B",
        "text": "A reflexão da luz pela Terra."
      },
      {
        "letter": "C",
        "text": "O aquecimento solar, que provoca a sublimação de materiais voláteis e libera gás e poeira."
      },
      {
        "letter": "D",
        "text": "A atração do cometa pela Lua."
      },
      {
        "letter": "E",
        "text": "A combustão do núcleo em oxigênio."
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação didática inspirada em questões observacionais da OBA Online 2024 sobre o cometa 12P/Pons–Brooks.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "coma",
      "cauda",
      "sublimação"
    ]
  },
  {
    "id": "cometa-oba-2024-cauda-direcao",
    "title": "Direção da cauda de um cometa",
    "discipline": "Física",
    "subject": "Astronomia",
    "subtopic": "Cometas",
    "bank": "OBA Online (adaptada)",
    "institution": "Olimpíada Brasileira de Astronomia e Astronáutica",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Um cometa é observado em diferentes posições de sua órbita. Qual descrição é a melhor aproximação para a direção geral de suas caudas?",
    "choices": [
      {
        "letter": "A",
        "text": "Apontam geralmente para longe do Sol; a cauda de poeira pode ser curva e a cauda iônica tende a ser mais retilínea."
      },
      {
        "letter": "B",
        "text": "Apontam sempre para trás, exatamente no sentido oposto à velocidade do cometa."
      },
      {
        "letter": "C",
        "text": "Apontam sempre para a Terra."
      },
      {
        "letter": "D",
        "text": "Apontam para o Sol em qualquer posição orbital."
      },
      {
        "letter": "E",
        "text": "Permanecem fixas no espaço enquanto o núcleo se desloca."
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Adaptação didática inspirada em questões observacionais da OBA Online 2024 sobre o cometa 12P/Pons–Brooks.",
    "sourceUrl": "https://site.oba.org.br/provas-e-gabaritos",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "cometa",
      "cometas",
      "cauda",
      "vento solar",
      "pressão de radiação"
    ]
  }
,
[
  {
    "id": "questao-extra-20261029-01",
    "title": "Corrente em aparelhos ligados em paralelo",
    "discipline": "Física",
    "subject": "Eletricidade",
    "subtopic": "Potência e corrente elétrica",
    "bank": "ENEM 2024 (adaptada)",
    "institution": "INEP",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Em uma instalação de 127 V, dois aparelhos resistivos de 1 000 W e 500 W são ligados em paralelo. Desprezando perdas, qual é aproximadamente a corrente total fornecida pela rede?",
    "choices": [
      {
        "letter": "A",
        "text": "3,9 A"
      },
      {
        "letter": "B",
        "text": "7,9 A"
      },
      {
        "letter": "C",
        "text": "11,8 A"
      },
      {
        "letter": "D",
        "text": "15,0 A"
      },
      {
        "letter": "E",
        "text": "19,7 A"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ENEM 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD12.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletricidade",
      "Potência e corrente elétrica",
      "circuitos"
    ]
  },
  {
    "id": "questao-extra-20261029-02",
    "title": "Economia mensal com lâmpadas LED",
    "discipline": "Física",
    "subject": "Eletricidade",
    "subtopic": "Consumo de energia",
    "bank": "ENEM 2024 (adaptada)",
    "institution": "INEP",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Uma lâmpada incandescente de 60 W é substituída por uma LED de 9 W, com iluminação equivalente. Usadas 5 horas por dia durante 30 dias, quantos quilowatts-hora são economizados?",
    "choices": [
      {
        "letter": "A",
        "text": "1,53 kWh"
      },
      {
        "letter": "B",
        "text": "7,65 kWh"
      },
      {
        "letter": "C",
        "text": "9,00 kWh"
      },
      {
        "letter": "D",
        "text": "51,0 kWh"
      },
      {
        "letter": "E",
        "text": "76,5 kWh"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ENEM 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD12.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletricidade",
      "Consumo de energia",
      "energia elétrica"
    ]
  },
  {
    "id": "questao-extra-20261029-03",
    "title": "Aquecimento de água em um recipiente",
    "discipline": "Física",
    "subject": "Termologia",
    "subtopic": "Calor sensível",
    "bank": "ENEM 2024 (adaptada)",
    "institution": "INEP",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Uma quantidade de 0,40 kg de água recebe calor e sua temperatura aumenta 15 °C. Adote calor específico da água igual a 4 200 J/(kg·°C). Qual é o calor absorvido?",
    "choices": [
      {
        "letter": "A",
        "text": "2,52 kJ"
      },
      {
        "letter": "B",
        "text": "10,5 kJ"
      },
      {
        "letter": "C",
        "text": "16,8 kJ"
      },
      {
        "letter": "D",
        "text": "25,2 kJ"
      },
      {
        "letter": "E",
        "text": "42,0 kJ"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ENEM 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD12.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Termologia",
      "Calor sensível",
      "calorimetria"
    ]
  },
  {
    "id": "questao-extra-20261029-04",
    "title": "Impulso em uma colisão com uma parede",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Quantidade de movimento e impulso",
    "bank": "ENEM 2024 (adaptada)",
    "institution": "INEP",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Uma bola de 0,15 kg move-se perpendicularmente a uma parede a 12 m/s e retorna no sentido oposto a 8 m/s. Qual é o módulo do impulso recebido pela bola?",
    "choices": [
      {
        "letter": "A",
        "text": "0,60 N·s"
      },
      {
        "letter": "B",
        "text": "1,20 N·s"
      },
      {
        "letter": "C",
        "text": "2,00 N·s"
      },
      {
        "letter": "D",
        "text": "3,00 N·s"
      },
      {
        "letter": "E",
        "text": "4,00 N·s"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ENEM 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD12.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Quantidade de movimento e impulso",
      "impulso"
    ]
  },
  {
    "id": "questao-extra-20261029-05",
    "title": "Reflexão em um espelho plano",
    "discipline": "Física",
    "subject": "Óptica",
    "subtopic": "Reflexão da luz",
    "bank": "ENEM 2024 (adaptada)",
    "institution": "INEP",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Um raio luminoso incide sobre um espelho plano formando 35° com a normal à superfície. Qual é o ângulo entre o raio incidente e o refletido?",
    "choices": [
      {
        "letter": "A",
        "text": "35°"
      },
      {
        "letter": "B",
        "text": "70°"
      },
      {
        "letter": "C",
        "text": "90°"
      },
      {
        "letter": "D",
        "text": "110°"
      },
      {
        "letter": "E",
        "text": "145°"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ENEM 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD12.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Óptica",
      "Reflexão da luz",
      "óptica geométrica"
    ]
  },
  {
    "id": "questao-extra-20261029-06",
    "title": "Velocidade média de uma bicicleta",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Movimento uniforme",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Durante um trecho retilíneo, uma bicicleta percorre 180 m em 30 s, mantendo velocidade constante. Qual é o módulo dessa velocidade?",
    "choices": [
      {
        "letter": "A",
        "text": "3 m/s"
      },
      {
        "letter": "B",
        "text": "5 m/s"
      },
      {
        "letter": "C",
        "text": "6 m/s"
      },
      {
        "letter": "D",
        "text": "9 m/s"
      },
      {
        "letter": "E",
        "text": "15 m/s"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em OBF 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1_p.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Movimento uniforme",
      "cinemática"
    ]
  },
  {
    "id": "questao-extra-20261029-07",
    "title": "Conversão de temperatura",
    "discipline": "Física",
    "subject": "Termologia",
    "subtopic": "Escalas termométricas",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "A temperatura de uma sala é 25 °C. Qual valor corresponde a essa temperatura na escala Fahrenheit?",
    "choices": [
      {
        "letter": "A",
        "text": "77 °F"
      },
      {
        "letter": "B",
        "text": "68 °F"
      },
      {
        "letter": "C",
        "text": "45 °F"
      },
      {
        "letter": "D",
        "text": "52 °F"
      },
      {
        "letter": "E",
        "text": "90 °F"
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em OBF 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1_p.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Termologia",
      "Escalas termométricas",
      "temperatura"
    ]
  },
  {
    "id": "questao-extra-20261029-08",
    "title": "Deslocamento em duas direções",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Vetores",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Uma estudante caminha 5 m para leste e depois 12 m para norte. Qual é o módulo do deslocamento entre o ponto inicial e o final?",
    "choices": [
      {
        "letter": "A",
        "text": "7 m"
      },
      {
        "letter": "B",
        "text": "13 m"
      },
      {
        "letter": "C",
        "text": "17 m"
      },
      {
        "letter": "D",
        "text": "60 m"
      },
      {
        "letter": "E",
        "text": "(5 + 12) m"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em OBF 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1_p.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Vetores",
      "vetores"
    ]
  },
  {
    "id": "questao-extra-20261029-09",
    "title": "Velocidade de propagação de uma onda",
    "discipline": "Física",
    "subject": "Ondulatória",
    "subtopic": "Equação fundamental da onda",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Uma onda periódica tem comprimento de onda 0,75 m e frequência 4,0 Hz. Qual é sua velocidade de propagação?",
    "choices": [
      {
        "letter": "A",
        "text": "0,19 m/s"
      },
      {
        "letter": "B",
        "text": "1,33 m/s"
      },
      {
        "letter": "C",
        "text": "3,0 m/s"
      },
      {
        "letter": "D",
        "text": "5,3 m/s"
      },
      {
        "letter": "E",
        "text": "16 m/s"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em OBF 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1_p.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Ondulatória",
      "Equação fundamental da onda",
      "ondas"
    ]
  },
  {
    "id": "questao-extra-20261029-10",
    "title": "Pressão da água em uma piscina",
    "discipline": "Física",
    "subject": "Fluidos",
    "subtopic": "Pressão hidrostática",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Em uma piscina, um ponto está a 1,2 m abaixo da superfície. Considerando água com densidade 1 000 kg/m³ e g = 10 m/s², qual é a pressão manométrica nesse ponto?",
    "choices": [
      {
        "letter": "A",
        "text": "1 200 Pa"
      },
      {
        "letter": "B",
        "text": "6 000 Pa"
      },
      {
        "letter": "C",
        "text": "10 000 Pa"
      },
      {
        "letter": "D",
        "text": "12 000 Pa"
      },
      {
        "letter": "E",
        "text": "120 000 Pa"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em OBF 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1_p.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Fluidos",
      "Pressão hidrostática",
      "hidrostática"
    ]
  },
  {
    "id": "questao-extra-20261029-11",
    "title": "Energia cinética de um carrinho",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Energia cinética",
    "bank": "ITA 2024 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Um carrinho de 4,0 kg desloca-se a 5,0 m/s em relação ao solo. Qual é sua energia cinética?",
    "choices": [
      {
        "letter": "A",
        "text": "20 J"
      },
      {
        "letter": "B",
        "text": "50 J"
      },
      {
        "letter": "C",
        "text": "80 J"
      },
      {
        "letter": "D",
        "text": "100 J"
      },
      {
        "letter": "E",
        "text": "200 J"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ITA 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://vestibular.ita.br/provas/2024_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Energia cinética",
      "energia"
    ]
  },
  {
    "id": "questao-extra-20261029-12",
    "title": "Velocidade da sombra de uma pessoa",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Movimento relativo",
    "bank": "ITA 2024 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2024,
    "difficulty": "Difícil",
    "statement": "Uma luminária pontual está a 8 m do chão. Uma pessoa de 2 m de altura caminha em linha reta, afastando-se da base da luminária a 1,5 m/s. Qual é a velocidade da extremidade da sombra da pessoa em relação ao chão?",
    "choices": [
      {
        "letter": "A",
        "text": "0,5 m/s"
      },
      {
        "letter": "B",
        "text": "1,0 m/s"
      },
      {
        "letter": "C",
        "text": "1,5 m/s"
      },
      {
        "letter": "D",
        "text": "2,0 m/s"
      },
      {
        "letter": "E",
        "text": "3,0 m/s"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ITA 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://vestibular.ita.br/provas/2024_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Movimento relativo",
      "cinemática"
    ]
  },
  {
    "id": "questao-extra-20261029-13",
    "title": "Variação do período de um pêndulo",
    "discipline": "Física",
    "subject": "Oscilações",
    "subtopic": "Pêndulo simples e dilatação",
    "bank": "ITA 2024 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2024,
    "difficulty": "Difícil",
    "statement": "Um pêndulo simples tem período inicial de 2,000 s. Sua haste metálica, de coeficiente de dilatação linear 2,0 × 10⁻⁵ °C⁻¹, sofre aquecimento de 100 °C. Para pequenas variações, T é proporcional a √L. Qual é aproximadamente o novo período?",
    "choices": [
      {
        "letter": "A",
        "text": "2,000 s"
      },
      {
        "letter": "B",
        "text": "2,001 s"
      },
      {
        "letter": "C",
        "text": "2,002 s"
      },
      {
        "letter": "D",
        "text": "2,004 s"
      },
      {
        "letter": "E",
        "text": "2,040 s"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ITA 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://vestibular.ita.br/provas/2024_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Oscilações",
      "Pêndulo simples e dilatação",
      "oscilações"
    ]
  },
  {
    "id": "questao-extra-20261029-14",
    "title": "Imagem formada por uma lente convergente",
    "discipline": "Física",
    "subject": "Óptica",
    "subtopic": "Lentes esféricas",
    "bank": "ITA 2024 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Um objeto é colocado a 20 cm de uma lente convergente cuja distância focal é 12 cm. Usando a equação das lentes delgadas, a que distância da lente se forma a imagem?",
    "choices": [
      {
        "letter": "A",
        "text": "7,5 cm"
      },
      {
        "letter": "B",
        "text": "12 cm"
      },
      {
        "letter": "C",
        "text": "20 cm"
      },
      {
        "letter": "D",
        "text": "30 cm"
      },
      {
        "letter": "E",
        "text": "60 cm"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ITA 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://vestibular.ita.br/provas/2024_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Óptica",
      "Lentes esféricas",
      "lentes"
    ]
  },
  {
    "id": "questao-extra-20261029-15",
    "title": "Força eletromotriz induzida em uma bobina",
    "discipline": "Física",
    "subject": "Eletromagnetismo",
    "subtopic": "Indução eletromagnética",
    "bank": "ITA 2024 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Uma bobina com 200 espiras sofre uma variação uniforme do fluxo magnético por espira de 9,0 × 10⁻⁴ Wb em 0,030 s. Qual é o módulo da força eletromotriz média induzida?",
    "choices": [
      {
        "letter": "A",
        "text": "0,6 V"
      },
      {
        "letter": "B",
        "text": "6,0 V"
      },
      {
        "letter": "C",
        "text": "30 V"
      },
      {
        "letter": "D",
        "text": "60 V"
      },
      {
        "letter": "E",
        "text": "180 V"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em ITA 2024 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://vestibular.ita.br/provas/2024_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletromagnetismo",
      "Indução eletromagnética",
      "indução"
    ]
  },
  {
    "id": "questao-extra-20261029-16",
    "title": "Alcance de um projétil lançado horizontalmente",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Lançamento horizontal",
    "bank": "IME 2024–2025 (adaptada)",
    "institution": "Instituto Militar de Engenharia",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Um objeto é lançado horizontalmente do alto de uma plataforma de 45 m com velocidade inicial de 12 m/s. Despreze a resistência do ar e use g = 10 m/s². Qual é o alcance horizontal?",
    "choices": [
      {
        "letter": "A",
        "text": "12 m"
      },
      {
        "letter": "B",
        "text": "24 m"
      },
      {
        "letter": "C",
        "text": "30 m"
      },
      {
        "letter": "D",
        "text": "36 m"
      },
      {
        "letter": "E",
        "text": "54 m"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em IME 2024–2025 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.ime.eb.mil.br/vestibular-e-concursos/cfg-ensino-medio/provas-anteriores-cfg",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Lançamento horizontal",
      "lançamento"
    ]
  },
  {
    "id": "questao-extra-20261029-17",
    "title": "Interação entre duas cargas elétricas",
    "discipline": "Física",
    "subject": "Eletromagnetismo",
    "subtopic": "Lei de Coulomb",
    "bank": "IME 2024–2025 (adaptada)",
    "institution": "Instituto Militar de Engenharia",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Duas cargas puntiformes positivas, de 4,0 μC e 2,0 μC, estão separadas por 0,30 m no vácuo. Adote k = 9,0 × 10⁹ N·m²/C². Qual é o módulo da força elétrica entre elas?",
    "choices": [
      {
        "letter": "A",
        "text": "0,08 N"
      },
      {
        "letter": "B",
        "text": "0,80 N"
      },
      {
        "letter": "C",
        "text": "1,8 N"
      },
      {
        "letter": "D",
        "text": "8,0 N"
      },
      {
        "letter": "E",
        "text": "80 N"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em IME 2024–2025 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.ime.eb.mil.br/vestibular-e-concursos/cfg-ensino-medio/provas-anteriores-cfg",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletromagnetismo",
      "Lei de Coulomb",
      "eletrostática"
    ]
  },
  {
    "id": "questao-extra-20261029-18",
    "title": "Equilíbrio em um tubo em U",
    "discipline": "Física",
    "subject": "Fluidos",
    "subtopic": "Pressão e densidade",
    "bank": "IME 2024–2025 (adaptada)",
    "institution": "Instituto Militar de Engenharia",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Em um tubo em U aberto, uma coluna de óleo de densidade 800 kg/m³ tem altura de 0,25 m acima da interface com água. Qual altura de água produz a mesma pressão hidrostática? Considere as duas colunas em equilíbrio.",
    "choices": [
      {
        "letter": "A",
        "text": "0,20 m"
      },
      {
        "letter": "B",
        "text": "0,25 m"
      },
      {
        "letter": "C",
        "text": "0,31 m"
      },
      {
        "letter": "D",
        "text": "0,40 m"
      },
      {
        "letter": "E",
        "text": "0,80 m"
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em IME 2024–2025 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.ime.eb.mil.br/vestibular-e-concursos/cfg-ensino-medio/provas-anteriores-cfg",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Fluidos",
      "Pressão e densidade",
      "fluidos"
    ]
  },
  {
    "id": "questao-extra-20261029-19",
    "title": "Velocidade após uma colisão perfeitamente inelástica",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Colisões e conservação do momento",
    "bank": "FUVEST 2023 (adaptada)",
    "institution": "Fundação Universitária para o Vestibular",
    "year": 2023,
    "difficulty": "Média",
    "statement": "Um carrinho de 2 kg move-se a 6 m/s e colide com outro de 4 kg inicialmente em repouso. Os carrinhos ficam unidos após o choque. Qual é a velocidade do conjunto imediatamente após a colisão?",
    "choices": [
      {
        "letter": "A",
        "text": "1 m/s"
      },
      {
        "letter": "B",
        "text": "1,5 m/s"
      },
      {
        "letter": "C",
        "text": "2 m/s"
      },
      {
        "letter": "D",
        "text": "3 m/s"
      },
      {
        "letter": "E",
        "text": "6 m/s"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em FUVEST 2023 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.fuvest.br/acervo-vestibular-2023/",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Colisões e conservação do momento",
      "colisões"
    ]
  },
  {
    "id": "questao-extra-20261029-20",
    "title": "Potência útil de uma pequena usina",
    "discipline": "Física",
    "subject": "Energia",
    "subtopic": "Transformação de energia",
    "bank": "FUVEST 2023 (adaptada)",
    "institution": "Fundação Universitária para o Vestibular",
    "year": 2023,
    "difficulty": "Média",
    "statement": "Uma usina recebe 3,0 kg de água por segundo, que cai de uma altura de 10 m. Se 50% da energia potencial gravitacional é convertida em energia elétrica e g = 10 m/s², qual é a potência elétrica gerada?",
    "choices": [
      {
        "letter": "A",
        "text": "30 W"
      },
      {
        "letter": "B",
        "text": "150 W"
      },
      {
        "letter": "C",
        "text": "300 W"
      },
      {
        "letter": "D",
        "text": "600 W"
      },
      {
        "letter": "E",
        "text": "1 500 W"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em FUVEST 2023 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.fuvest.br/acervo-vestibular-2023/",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Energia",
      "Transformação de energia",
      "energia"
    ]
  },
  {
    "id": "questao-extra-20261029-21",
    "title": "Distância entre objeto e imagem em espelho plano",
    "discipline": "Física",
    "subject": "Óptica",
    "subtopic": "Espelho plano",
    "bank": "FUVEST 2023 (adaptada)",
    "institution": "Fundação Universitária para o Vestibular",
    "year": 2023,
    "difficulty": "Fácil",
    "statement": "Um objeto está a 2,0 m diante de um espelho plano. Qual é a distância entre o objeto e sua imagem?",
    "choices": [
      {
        "letter": "A",
        "text": "4,0 m"
      },
      {
        "letter": "B",
        "text": "2,0 m"
      },
      {
        "letter": "C",
        "text": "1,0 m"
      },
      {
        "letter": "D",
        "text": "0,5 m"
      },
      {
        "letter": "E",
        "text": "A imagem coincide com o objeto"
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em FUVEST 2023 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.fuvest.br/acervo-vestibular-2023/",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Óptica",
      "Espelho plano",
      "espelhos"
    ]
  },
  {
    "id": "questao-extra-20261029-22",
    "title": "Velocidade de um bloco após descer uma rampa",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Conservação da energia mecânica",
    "bank": "EFOMM 2026 (adaptada)",
    "institution": "Escola de Formação de Oficiais da Marinha Mercante",
    "year": 2026,
    "difficulty": "Média",
    "statement": "Um bloco parte do repouso e desce uma pista sem atrito, perdendo 1,25 m de altura. Adote g = 10 m/s². Qual é sua velocidade ao atingir o ponto mais baixo?",
    "choices": [
      {
        "letter": "A",
        "text": "2,5 m/s"
      },
      {
        "letter": "B",
        "text": "4,0 m/s"
      },
      {
        "letter": "C",
        "text": "4,5 m/s"
      },
      {
        "letter": "D",
        "text": "5,0 m/s"
      },
      {
        "letter": "E",
        "text": "12,5 m/s"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em EFOMM 2026 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.marinha.mil.br/ciaga/sites/www.marinha.mil.br.ciaga/files/Processos%20Seletivos/PROVA%20BRANCA%202%20DIA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Conservação da energia mecânica",
      "energia mecânica"
    ]
  },
  {
    "id": "questao-extra-20261029-23",
    "title": "Aceleração centrípeta de um navio em curva",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Movimento circular",
    "bank": "EFOMM 2026 (adaptada)",
    "institution": "Escola de Formação de Oficiais da Marinha Mercante",
    "year": 2026,
    "difficulty": "Média",
    "statement": "Uma embarcação descreve uma curva circular de raio 20 m com velocidade constante de 10 m/s. Qual é o módulo de sua aceleração centrípeta?",
    "choices": [
      {
        "letter": "A",
        "text": "2,0 m/s²"
      },
      {
        "letter": "B",
        "text": "4,0 m/s²"
      },
      {
        "letter": "C",
        "text": "5,0 m/s²"
      },
      {
        "letter": "D",
        "text": "10 m/s²"
      },
      {
        "letter": "E",
        "text": "20 m/s²"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em EFOMM 2026 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.marinha.mil.br/ciaga/sites/www.marinha.mil.br.ciaga/files/Processos%20Seletivos/PROVA%20BRANCA%202%20DIA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Movimento circular",
      "movimento circular"
    ]
  },
  {
    "id": "questao-extra-20261029-24",
    "title": "Empuxo sobre um bloco totalmente submerso",
    "discipline": "Física",
    "subject": "Fluidos",
    "subtopic": "Princípio de Arquimedes",
    "bank": "EFOMM 2026 (adaptada)",
    "institution": "Escola de Formação de Oficiais da Marinha Mercante",
    "year": 2026,
    "difficulty": "Média",
    "statement": "Um bloco de volume 0,002 m³ está totalmente submerso em água de densidade 1 000 kg/m³. Use g = 10 m/s². Qual é o empuxo exercido pela água?",
    "choices": [
      {
        "letter": "A",
        "text": "2 N"
      },
      {
        "letter": "B",
        "text": "20 N"
      },
      {
        "letter": "C",
        "text": "200 N"
      },
      {
        "letter": "D",
        "text": "2 000 N"
      },
      {
        "letter": "E",
        "text": "20 000 N"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em EFOMM 2026 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.marinha.mil.br/ciaga/sites/www.marinha.mil.br.ciaga/files/Processos%20Seletivos/PROVA%20BRANCA%202%20DIA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Fluidos",
      "Princípio de Arquimedes",
      "empuxo"
    ]
  },
  {
    "id": "questao-extra-20261029-25",
    "title": "Profundidade medida por sonar",
    "discipline": "Física",
    "subject": "Ondulatória",
    "subtopic": "Eco e velocidade do som",
    "bank": "EFOMM 2026 (adaptada)",
    "institution": "Escola de Formação de Oficiais da Marinha Mercante",
    "year": 2026,
    "difficulty": "Média",
    "statement": "Um sonar emite um pulso sonoro que retorna após 2,0 s. Considerando a velocidade do som na água igual a 1 500 m/s, qual é a profundidade no local?",
    "choices": [
      {
        "letter": "A",
        "text": "750 m"
      },
      {
        "letter": "B",
        "text": "1 000 m"
      },
      {
        "letter": "C",
        "text": "1 250 m"
      },
      {
        "letter": "D",
        "text": "1 500 m"
      },
      {
        "letter": "E",
        "text": "3 000 m"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada de temas de Física cobrados em EFOMM 2026 (adaptada); enunciado e alternativas próprios.",
    "sourceUrl": "https://www.marinha.mil.br/ciaga/sites/www.marinha.mil.br.ciaga/files/Processos%20Seletivos/PROVA%20BRANCA%202%20DIA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Ondulatória",
      "Eco e velocidade do som",
      "ondas"
    ]
  }
]
,
[
  {
    "id": "questao-extra-20261029-26",
    "title": "Trabalho para elevar uma carga por uma rampa",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Trabalho e máquinas simples",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Uma carga de peso 300 N deve subir 1,5 m por uma rampa de 6,0 m. Despreze o atrito e suponha que a força aplicada seja paralela à rampa. Qual é o módulo dessa força?",
    "choices": [
      {
        "letter": "A",
        "text": "50 N"
      },
      {
        "letter": "B",
        "text": "75 N"
      },
      {
        "letter": "C",
        "text": "100 N"
      },
      {
        "letter": "D",
        "text": "150 N"
      },
      {
        "letter": "E",
        "text": "300 N"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 10 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Trabalho e máquinas simples",
      "plano inclinado"
    ]
  },
  {
    "id": "questao-extra-20261029-27",
    "title": "Por que o metal parece mais frio que o plástico",
    "discipline": "Física",
    "subject": "Termologia",
    "subtopic": "Condução térmica",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Duas placas, uma de metal e outra de plástico, ficaram por bastante tempo na mesma sala. Ao tocá-las, a placa metálica parece mais fria. Qual explicação é compatível com essa observação?",
    "choices": [
      {
        "letter": "A",
        "text": "As placas podem estar à mesma temperatura, mas o metal conduz calor da mão mais rapidamente."
      },
      {
        "letter": "B",
        "text": "O metal está necessariamente a uma temperatura menor que a do plástico."
      },
      {
        "letter": "C",
        "text": "O plástico conduz calor melhor e retira energia da mão mais depressa."
      },
      {
        "letter": "D",
        "text": "A sensação prova que a placa metálica está abaixo de 0 °C."
      },
      {
        "letter": "E",
        "text": "O metal produz frio, que passa para a mão."
      }
    ],
    "correct": "A",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 11 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Termologia",
      "Condução térmica",
      "calor"
    ]
  },
  {
    "id": "questao-extra-20261029-28",
    "title": "Gelo flutuando em um copo cheio",
    "discipline": "Física",
    "subject": "Termologia",
    "subtopic": "Mudanças de estado e calor",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Um copo cheio até a borda contém água e cubos de gelo que flutuam, sem tocar o fundo. Considere: I. gotas na parte externa podem vir da condensação do vapor de água do ar; II. ao derreter, o gelo necessariamente faz o nível subir; III. a água transfere calor para o gelo durante a fusão. Quais afirmações são corretas?",
    "choices": [
      {
        "letter": "A",
        "text": "Apenas I"
      },
      {
        "letter": "B",
        "text": "Apenas II"
      },
      {
        "letter": "C",
        "text": "Apenas I e III"
      },
      {
        "letter": "D",
        "text": "Apenas II e III"
      },
      {
        "letter": "E",
        "text": "I, II e III"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 12 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Termologia",
      "Mudanças de estado e calor",
      "mudança de estado"
    ]
  },
  {
    "id": "questao-extra-20261029-29",
    "title": "Rodas internas e externas em uma curva",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Movimento circular e rolamento",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Difícil",
    "statement": "Um automóvel faz uma curva de raio constante, com rapidez constante, e suas rodas rolam sem escorregar. Comparadas às rodas internas, as rodas externas percorrem arcos maiores no mesmo intervalo de tempo. Sobre a rotação das rodas em torno dos próprios eixos, qual afirmação é correta?",
    "choices": [
      {
        "letter": "A",
        "text": "As internas têm maior velocidade angular e aceleração angular positiva."
      },
      {
        "letter": "B",
        "text": "As externas têm menor velocidade angular e aceleração angular nula."
      },
      {
        "letter": "C",
        "text": "Todas têm a mesma velocidade angular e aceleração angular positiva."
      },
      {
        "letter": "D",
        "text": "As externas têm maior velocidade angular e, nesse movimento uniforme, aceleração angular nula."
      },
      {
        "letter": "E",
        "text": "As internas têm maior velocidade angular e todas têm aceleração angular nula."
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 13 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Movimento circular e rolamento",
      "rolamento"
    ]
  },
  {
    "id": "questao-extra-20261029-30",
    "title": "Como as gotículas formam o arco-íris",
    "discipline": "Física",
    "subject": "Óptica",
    "subtopic": "Refração, dispersão e reflexão interna",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Na formação do arco-íris primário, a luz solar interage com gotículas de água. Qual sequência descreve melhor o processo?",
    "choices": [
      {
        "letter": "A",
        "text": "A luz é absorvida pela gota e reemitida sem mudar de direção."
      },
      {
        "letter": "B",
        "text": "A refração na entrada dispersa as cores; uma reflexão interna redireciona a luz; e a refração na saída contribui para separá-las."
      },
      {
        "letter": "C",
        "text": "Apenas a reflexão externa separa as cores, sem refração."
      },
      {
        "letter": "D",
        "text": "A difração na superfície da gota produz todas as cores do arco."
      },
      {
        "letter": "E",
        "text": "A gota transforma luz branca em luz monocromática."
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 14 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Óptica",
      "Refração, dispersão e reflexão interna",
      "arco-íris"
    ]
  },
  {
    "id": "questao-extra-20261029-31",
    "title": "Tempo para erguer um balde com um sarilho",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Roda e eixo",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Um sarilho enrola uma corda em um cilindro de raio 0,10 m. O balde precisa subir 6,0 m, e a manivela completa uma volta a cada 4,0 s. Desprezando o deslizamento da corda, qual é aproximadamente o tempo de subida? Use π ≈ 3,14.",
    "choices": [
      {
        "letter": "A",
        "text": "12 s"
      },
      {
        "letter": "B",
        "text": "20 s"
      },
      {
        "letter": "C",
        "text": "40 s"
      },
      {
        "letter": "D",
        "text": "60 s"
      },
      {
        "letter": "E",
        "text": "80 s"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 16 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Roda e eixo",
      "máquinas simples"
    ]
  },
  {
    "id": "questao-extra-20261029-32",
    "title": "Força para sustentar um balde na manivela",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Equilíbrio de torques",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Um balde de massa total 12 kg fica suspenso por uma corda enrolada em um cilindro de raio 0,10 m. Uma pessoa aplica força perpendicular à manivela, cujo braço mede 0,30 m. Qual força mínima mantém o balde parado? Use g = 10 m/s².",
    "choices": [
      {
        "letter": "A",
        "text": "20 N"
      },
      {
        "letter": "B",
        "text": "40 N"
      },
      {
        "letter": "C",
        "text": "60 N"
      },
      {
        "letter": "D",
        "text": "80 N"
      },
      {
        "letter": "E",
        "text": "120 N"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 17 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Equilíbrio de torques",
      "torque"
    ]
  },
  {
    "id": "questao-extra-20261029-33",
    "title": "Lupa concentrando a luz solar",
    "discipline": "Física",
    "subject": "Óptica",
    "subtopic": "Lentes e energia luminosa",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Fácil",
    "statement": "Uma lupa é usada para concentrar a luz do Sol sobre um pedaço de papel. Qual afirmação explica corretamente o aquecimento?",
    "choices": [
      {
        "letter": "A",
        "text": "A lupa cria energia luminosa adicional, e o papel queima ao atingir um valor de energia total."
      },
      {
        "letter": "B",
        "text": "A lupa concentra a energia luminosa incidente, elevando a temperatura do papel até a ignição."
      },
      {
        "letter": "C",
        "text": "A lupa converte a luz em frio, que é absorvido pelo papel."
      },
      {
        "letter": "D",
        "text": "A lupa aumenta a frequência da luz até que o papel se incendeie."
      },
      {
        "letter": "E",
        "text": "O papel queima porque a lupa impede qualquer troca de calor com o ar."
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 18 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Óptica",
      "Lentes e energia luminosa",
      "lupa"
    ]
  },
  {
    "id": "questao-extra-20261029-34",
    "title": "Queda livre: metade da altura e metade da velocidade final",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Queda livre",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Difícil",
    "statement": "Um parafuso é solto do repouso de uma altura h e cai em queda livre, sem resistência do ar. Compare o instante t₁ em que ele está à altura h/2 com o instante t₂ em que sua rapidez é metade da rapidez imediatamente antes de tocar o solo. Qual relação é correta?",
    "choices": [
      {
        "letter": "A",
        "text": "t₂ = t₁ e t₂ = t_f/2"
      },
      {
        "letter": "B",
        "text": "t₂ = t₁ e t₂ < t_f/2"
      },
      {
        "letter": "C",
        "text": "t₂ = t₁ e t₂ > t_f/2"
      },
      {
        "letter": "D",
        "text": "t₂ < t₁ e t₂ = t_f/2"
      },
      {
        "letter": "E",
        "text": "t₂ > t₁ e t₂ = t_f/2"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 19 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Queda livre",
      "queda livre"
    ]
  },
  {
    "id": "questao-extra-20261029-35",
    "title": "Energia durante o quique de uma bola",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Colisões e energia mecânica",
    "bank": "OBF 2024 (adaptada)",
    "institution": "Olimpíada Brasileira de Física",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Uma bola de borracha cai sobre um piso rígido e retorna com rapidez menor que a rapidez de chegada. Considere: I. durante a compressão, parte da energia cinética transforma-se em energia potencial elástica; II. o piso armazena toda a energia que lança a bola de volta; III. parte da energia mecânica transforma-se em outras formas, como energia térmica e som. Quais afirmações são corretas?",
    "choices": [
      {
        "letter": "A",
        "text": "Apenas I"
      },
      {
        "letter": "B",
        "text": "Apenas II"
      },
      {
        "letter": "C",
        "text": "Apenas III"
      },
      {
        "letter": "D",
        "text": "Apenas I e II"
      },
      {
        "letter": "E",
        "text": "Apenas I e III"
      }
    ],
    "correct": "E",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 20 da OBF 2024; texto reescrito para estudo.",
    "sourceUrl": "https://app.graxaim.org/obf/2024/ga/pub/fase1_n1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Colisões e energia mecânica",
      "colisão"
    ]
  },
  {
    "id": "questao-extra-20261029-36",
    "title": "Período orbital e raio da órbita",
    "discipline": "Física",
    "subject": "Gravitação",
    "subtopic": "Leis de Kepler",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Dois satélites de massa desprezível orbitam o mesmo planeta em órbitas circulares. Se o raio orbital de um deles é três vezes maior que o do outro, qual é a razão entre seus períodos, maior sobre menor?",
    "choices": [
      {
        "letter": "A",
        "text": "√3"
      },
      {
        "letter": "B",
        "text": "3√3"
      },
      {
        "letter": "C",
        "text": "9"
      },
      {
        "letter": "D",
        "text": "27"
      },
      {
        "letter": "E",
        "text": "1/3"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 15 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Gravitação",
      "Leis de Kepler",
      "órbita"
    ]
  },
  {
    "id": "questao-extra-20261029-37",
    "title": "Três molas idênticas em série",
    "discipline": "Física",
    "subject": "Oscilações",
    "subtopic": "Sistema massa-mola",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Uma massa m oscila presa a uma mola de constante elástica k, com período T₀. Depois, a mesma massa é presa a três molas idênticas de constante k conectadas em série. Qual será o novo período?",
    "choices": [
      {
        "letter": "A",
        "text": "T₀/3"
      },
      {
        "letter": "B",
        "text": "T₀/√3"
      },
      {
        "letter": "C",
        "text": "√3 T₀"
      },
      {
        "letter": "D",
        "text": "3T₀"
      },
      {
        "letter": "E",
        "text": "3√3 T₀"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 16 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Oscilações",
      "Sistema massa-mola",
      "molas"
    ]
  },
  {
    "id": "questao-extra-20261029-38",
    "title": "Calor e trabalho em uma expansão isotérmica",
    "discipline": "Física",
    "subject": "Termodinâmica",
    "subtopic": "Primeira lei da Termodinâmica",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Um gás ideal sofre uma expansão isotérmica e recebe 120 J de calor. Adotando que o trabalho realizado pelo gás é positivo, qual é o trabalho realizado pelo gás nesse processo?",
    "choices": [
      {
        "letter": "A",
        "text": "0 J"
      },
      {
        "letter": "B",
        "text": "60 J"
      },
      {
        "letter": "C",
        "text": "120 J"
      },
      {
        "letter": "D",
        "text": "240 J"
      },
      {
        "letter": "E",
        "text": "Não é possível relacionar calor e trabalho"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 18 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Termodinâmica",
      "Primeira lei da Termodinâmica",
      "termodinâmica"
    ]
  },
  {
    "id": "questao-extra-20261029-39",
    "title": "Amplificação sonora em um estetoscópio ideal",
    "discipline": "Física",
    "subject": "Ondulatória",
    "subtopic": "Intensidade sonora e decibéis",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Em um modelo ideal, toda a potência sonora que atravessa uma membrana circular de raio R₁ chega a uma área circular menor de raio R₂. Se R₁/R₂ = 4, qual é aproximadamente o aumento do nível de intensidade sonora? Use Δβ = 10 log₁₀(I₂/I₁).",
    "choices": [
      {
        "letter": "A",
        "text": "3 dB"
      },
      {
        "letter": "B",
        "text": "6 dB"
      },
      {
        "letter": "C",
        "text": "9 dB"
      },
      {
        "letter": "D",
        "text": "12 dB"
      },
      {
        "letter": "E",
        "text": "24 dB"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 19 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Ondulatória",
      "Intensidade sonora e decibéis",
      "decibéis"
    ]
  },
  {
    "id": "questao-extra-20261029-40",
    "title": "Capacitor com duas regiões dielétricas",
    "discipline": "Física",
    "subject": "Eletromagnetismo",
    "subtopic": "Capacitância e dielétricos",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Entre duas placas paralelas de área total A e separação d, dois dielétricos ocupam metades laterais iguais da área, sem se sobrepor. Suas constantes dielétricas relativas são κ₁ = 2 e κ₂ = 4. Qual é a capacitância equivalente, desprezando efeitos de borda?",
    "choices": [
      {
        "letter": "A",
        "text": "ε₀A/d"
      },
      {
        "letter": "B",
        "text": "2ε₀A/d"
      },
      {
        "letter": "C",
        "text": "3ε₀A/d"
      },
      {
        "letter": "D",
        "text": "4ε₀A/d"
      },
      {
        "letter": "E",
        "text": "6ε₀A/d"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 21 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletromagnetismo",
      "Capacitância e dielétricos",
      "capacitores"
    ]
  },
  {
    "id": "questao-extra-20261029-41",
    "title": "Corrente induzida em uma espira circular",
    "discipline": "Física",
    "subject": "Eletromagnetismo",
    "subtopic": "Lei de Faraday-Lenz",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Uma espira única de raio 0,10 m está em um campo magnético perpendicular ao seu plano. O campo diminui uniformemente a 0,20 T/s, e a resistência da espira é 0,50 Ω. Qual é aproximadamente a corrente induzida? Use π ≈ 3,14.",
    "choices": [
      {
        "letter": "A",
        "text": "1,3 mA"
      },
      {
        "letter": "B",
        "text": "6,3 mA"
      },
      {
        "letter": "C",
        "text": "12,6 mA"
      },
      {
        "letter": "D",
        "text": "25,1 mA"
      },
      {
        "letter": "E",
        "text": "62,8 mA"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 23 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletromagnetismo",
      "Lei de Faraday-Lenz",
      "indução"
    ]
  },
  {
    "id": "questao-extra-20261029-42",
    "title": "Variação de energia em um espalhamento Raman",
    "discipline": "Física",
    "subject": "Física Moderna",
    "subtopic": "Energia do fóton",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Um fóton de comprimento de onda 500 nm é espalhado por um material e sai com comprimento de onda 520 nm. Usando hc = 1 240 eV·nm, quanto de energia aproximadamente o fóton transferiu ao material?",
    "choices": [
      {
        "letter": "A",
        "text": "0,0095 eV"
      },
      {
        "letter": "B",
        "text": "0,095 eV"
      },
      {
        "letter": "C",
        "text": "0,19 eV"
      },
      {
        "letter": "D",
        "text": "2,38 eV"
      },
      {
        "letter": "E",
        "text": "2,48 eV"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 24 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Física Moderna",
      "Energia do fóton",
      "efeito Raman"
    ]
  },
  {
    "id": "questao-extra-20261029-43",
    "title": "Instante de aproximação mínima ao eixo",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Função horária e ponto de retorno",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "A posição de uma partícula é x(t) = √[D² + (Vt − D)²], com D > 0 e V > 0. Em que instante a partícula atinge sua menor posição x?",
    "choices": [
      {
        "letter": "A",
        "text": "D/(2V)"
      },
      {
        "letter": "B",
        "text": "D/V"
      },
      {
        "letter": "C",
        "text": "2D/V"
      },
      {
        "letter": "D",
        "text": "D/V²"
      },
      {
        "letter": "E",
        "text": "2D²/V"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 13 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Função horária e ponto de retorno",
      "movimento"
    ]
  },
  {
    "id": "questao-extra-20261029-44",
    "title": "Medição de uma resistência desconhecida",
    "discipline": "Física",
    "subject": "Eletricidade",
    "subtopic": "Circuito em série e lei de Ohm",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Média",
    "statement": "Uma fonte ideal de 12 V está ligada em série a um resistor de 20 Ω e a um resistor desconhecido Rₓ. Um amperímetro ideal indica corrente de 0,40 A. Qual é o valor de Rₓ?",
    "choices": [
      {
        "letter": "A",
        "text": "4 Ω"
      },
      {
        "letter": "B",
        "text": "10 Ω"
      },
      {
        "letter": "C",
        "text": "12 Ω"
      },
      {
        "letter": "D",
        "text": "20 Ω"
      },
      {
        "letter": "E",
        "text": "50 Ω"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 22 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletricidade",
      "Circuito em série e lei de Ohm",
      "resistores"
    ]
  },
  {
    "id": "questao-extra-20261029-45",
    "title": "Velocidade após um trecho acelerado e uma descida",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Conservação da energia mecânica",
    "bank": "ITA 2025 (adaptada)",
    "institution": "Instituto Tecnológico de Aeronáutica",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Um carrinho parte do repouso e percorre um trecho horizontal de comprimento ℓ com aceleração constante a₀. Em seguida, desce sem atrito uma curva que reduz sua altura em R. Qual é sua rapidez ao final? Use g para a aceleração da gravidade.",
    "choices": [
      {
        "letter": "A",
        "text": "√(a₀ℓ + gR)"
      },
      {
        "letter": "B",
        "text": "√(2a₀ℓ + 2gR)"
      },
      {
        "letter": "C",
        "text": "√(2a₀ℓ + gR)"
      },
      {
        "letter": "D",
        "text": "2√(a₀ℓ + gR)"
      },
      {
        "letter": "E",
        "text": "√(a₀ℓ + 2gR)"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema da questão 14 do vestibular ITA 2025; texto reescrito para estudo.",
    "sourceUrl": "https://www.vestibular.ita.br/provas/2025_fase1.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Conservação da energia mecânica",
      "energia mecânica"
    ]
  },
  {
    "id": "questao-extra-20261029-46",
    "title": "Rendimento de um motor elétrico",
    "discipline": "Física",
    "subject": "Energia",
    "subtopic": "Rendimento e potência",
    "bank": "ENEM 2025 (estilo contextualizado)",
    "institution": "INEP",
    "year": 2025,
    "difficulty": "Fácil",
    "statement": "Um motor recebe potência elétrica de 1 500 W e fornece 1 200 W de potência mecânica útil. Qual é o rendimento do motor?",
    "choices": [
      {
        "letter": "A",
        "text": "20%"
      },
      {
        "letter": "B",
        "text": "60%"
      },
      {
        "letter": "C",
        "text": "75%"
      },
      {
        "letter": "D",
        "text": "80%"
      },
      {
        "letter": "E",
        "text": "125%"
      }
    ],
    "correct": "D",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral em formato contextualizado, com referência ao acervo oficial do ENEM; não é transcrição de um item específico.",
    "sourceUrl": "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2025",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Energia",
      "Rendimento e potência",
      "rendimento"
    ]
  },
  {
    "id": "questao-extra-20261029-47",
    "title": "Temperatura de equilíbrio em uma mistura de água",
    "discipline": "Física",
    "subject": "Termologia",
    "subtopic": "Equilíbrio térmico",
    "bank": "FUVEST 2024 (estilo vestibular)",
    "institution": "Fundação Universitária para o Vestibular",
    "year": 2024,
    "difficulty": "Média",
    "statement": "Misturam-se 200 g de água a 80 °C com 300 g de água a 20 °C em um recipiente termicamente isolado. Despreze a capacidade térmica do recipiente. Qual é a temperatura final de equilíbrio?",
    "choices": [
      {
        "letter": "A",
        "text": "32 °C"
      },
      {
        "letter": "B",
        "text": "44 °C"
      },
      {
        "letter": "C",
        "text": "50 °C"
      },
      {
        "letter": "D",
        "text": "56 °C"
      },
      {
        "letter": "E",
        "text": "60 °C"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral de calorimetria em formato de vestibular, com referência ao acervo oficial da FUVEST; não é transcrição de um item específico.",
    "sourceUrl": "https://www.fuvest.br/acervo-vestibular-2024",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Termologia",
      "Equilíbrio térmico",
      "calorimetria"
    ]
  },
  {
    "id": "questao-extra-20261029-48",
    "title": "Força magnética sobre uma carga perto de um fio",
    "discipline": "Física",
    "subject": "Eletromagnetismo",
    "subtopic": "Campo de corrente e força magnética",
    "bank": "IME 2025/2026 (adaptada)",
    "institution": "Instituto Militar de Engenharia",
    "year": 2026,
    "difficulty": "Difícil",
    "statement": "Um fio retilíneo longo conduz corrente de 5,0 A. A 5,0 cm do fio, uma partícula de carga 2,0 μC move-se a 1 000 m/s perpendicularmente ao campo magnético criado pelo fio. Use B = μ₀I/(2πr) e μ₀/(2π) = 2,0 × 10⁻⁷ T·m/A. Qual é o módulo da força magnética?",
    "choices": [
      {
        "letter": "A",
        "text": "4,0 × 10⁻⁹ N"
      },
      {
        "letter": "B",
        "text": "4,0 × 10⁻⁸ N"
      },
      {
        "letter": "C",
        "text": "4,0 × 10⁻⁷ N"
      },
      {
        "letter": "D",
        "text": "2,0 × 10⁻⁶ N"
      },
      {
        "letter": "E",
        "text": "4,0 × 10⁻⁵ N"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema de força magnética sobre partícula próxima a fio com corrente na prova do IME 2025/2026.",
    "sourceUrl": "https://www.ime.eb.mil.br/images/arquivos/admissao/cfg/provas-anteriores/2025-2026/Prova1fase2025OBJETIVA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Eletromagnetismo",
      "Campo de corrente e força magnética",
      "força magnética"
    ]
  },
  {
    "id": "questao-extra-20261029-49",
    "title": "Força sobre um elétron acelerado",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Trabalho e energia cinética",
    "bank": "IME 2024/2025 EQA (adaptada)",
    "institution": "Instituto Militar de Engenharia",
    "year": 2025,
    "difficulty": "Difícil",
    "statement": "Um elétron parte do repouso e é acelerado por uma força constante ao longo de 1,5 cm, atingindo 2,0 × 10⁶ m/s. Despreze efeitos relativísticos e use massa do elétron 9,1 × 10⁻³¹ kg. Qual é aproximadamente o módulo da força?",
    "choices": [
      {
        "letter": "A",
        "text": "6,1 × 10⁻¹⁷ N"
      },
      {
        "letter": "B",
        "text": "1,2 × 10⁻¹⁶ N"
      },
      {
        "letter": "C",
        "text": "2,4 × 10⁻¹⁶ N"
      },
      {
        "letter": "D",
        "text": "6,1 × 10⁻¹⁶ N"
      },
      {
        "letter": "E",
        "text": "1,2 × 10⁻¹⁵ N"
      }
    ],
    "correct": "B",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do problema de aceleração de elétron da prova discursiva de Física do IME/EQA 2024/2025.",
    "sourceUrl": "https://www.ime.eb.mil.br/images/arquivos/admissao/cg/provas-anteriores/2024-2025/EQA_-_Fisica_Discursiva.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Trabalho e energia cinética",
      "trabalho"
    ]
  },
  {
    "id": "questao-extra-20261029-50",
    "title": "Velocidades de blocos ligados por uma barra rígida",
    "discipline": "Física",
    "subject": "Mecânica",
    "subtopic": "Vínculos geométricos e velocidades",
    "bank": "EFOMM 2026 (adaptada)",
    "institution": "Escola de Formação de Oficiais da Marinha Mercante",
    "year": 2026,
    "difficulty": "Difícil",
    "statement": "Dois carrinhos movem-se em trilhos perpendiculares e são ligados por uma barra rígida de 1,0 m. Em certo instante, suas distâncias ao canto dos trilhos são x = 0,60 m e y = 0,80 m. Se o carrinho no eixo y se afasta do canto a 1,5 m/s, qual é o módulo da velocidade do carrinho no eixo x nesse instante?",
    "choices": [
      {
        "letter": "A",
        "text": "0,80 m/s"
      },
      {
        "letter": "B",
        "text": "1,5 m/s"
      },
      {
        "letter": "C",
        "text": "2,0 m/s"
      },
      {
        "letter": "D",
        "text": "2,5 m/s"
      },
      {
        "letter": "E",
        "text": "3,0 m/s"
      }
    ],
    "correct": "C",
    "solution": "Gabarito indicado. Esta questão ainda não possui solução revisada.",
    "source": "Questão autoral adaptada do tema de vínculo geométrico e conservação de energia da questão 21 da prova de Física EFOMM 2026.",
    "sourceUrl": "https://www.marinha.mil.br/ciaga/sites/www.marinha.mil.br.ciaga/files/Processos%20Seletivos/PROVA%20BRANCA%202%20DIA.pdf",
    "license": "Enunciado e alternativas reescritos/adaptados para estudo; não são transcrição literal.",
    "tags": [
      "Física",
      "Mecânica",
      "Vínculos geométricos e velocidades",
      "vínculo"
    ]
  }
]
];
