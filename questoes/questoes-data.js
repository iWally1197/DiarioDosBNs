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
];
