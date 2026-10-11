# Progresso dos laboratórios de Física

Atualizado em 11/10/2026. Este registro cobre o plano de 480 tópicos do Diário dos BNs e separa assuntos planejados de simulações já existentes. Um tópico só será marcado como **Validado** depois que modelo, interface, controles, unidades, acessibilidade, limitações e testes forem revisados; nenhum tópico está marcado como validado nesta auditoria.

## Auditoria inicial

- O catálogo estático agora contém **27 experiências interativas**, incluindo a queda livre e as nove simulações prioritárias adicionadas; a página 2D/3D de Faraday permanece como laboratório dedicado.
- O banco Supabase possui **83 registros** em `public.animations`; na auditoria, os 83 estavam publicados. O painel administrativo controla estes registros, que são usados na biblioteca principal e nas páginas públicas de tópicos.
- O plano mestre contém **480 tópicos em 9 áreas**. O catálogo estruturado abaixo mantém os 480 títulos, sem gerar páginas vazias.
- **29 tópicos** têm vínculo com uma simulação existente e ficam como **Implementado, aguardando validação**. Os outros **451** permanecem **Planejados**. FIS-021 e FIS-023 apontam para a mesma experiência de Newton.
- Há testes automatizados de modelos físicos existentes (MRU/MUV, lançamento, atrito, energia, colisões, mola, ondas, Ohm, óptica, calorimetria, campo elétrico e pêndulo). A presença de testes de modelo não valida, por si só, a experiência completa nem a interface no navegador.

## Arquitetura nesta etapa

- `physics-topics.json`: registro estruturado individual dos 480 tópicos e seus estados.
- `biblioteca-fisica.html` + `physics-topic-catalog.js`: catálogo pesquisável por assunto, área, subárea, dificuldade e estado; inclui um roteiro dos 25 tópicos prioritários em cinco grupos, com links e estados reais.
- `laboratorio-queda-livre.html` + `physics-freefall-model.js` + `physics-freefall.js` + `physics-freefall.css`: comparação 2D de massas em queda ideal, com referencial no solo, gráfico sincronizado, parâmetros e modo de tela cheia. Os filtros complementares mostram apenas os valores já registrados. Somente os 18 assuntos com experimento relacionado têm um link; os demais mostram o estado planejado, sem abrir páginas vazias.
- `laboratorio-faraday.html` + `physics-faraday-model.js` + `physics-faraday.js` + `physics-faraday.css`: piloto de bobina girando em campo uniforme, com modelo analítico de fluxo concatenado e lei de Faraday, vistas 2D/3D, parâmetros, gráfico e perspectiva ajustável; implementação em espera de validação visual.
- `admin-laboratorios.html`: painel administrativo para os registros reais de `public.animations`, com seleção individual e em massa, busca, filtros e publicação persistente.
- `supabase/migrations/20261011031216_admin_only_animation_publication.sql`: trigger de proteção para impedir que contas sem papel de administrador alterem `is_published` diretamente. A migração reutiliza `public.is_admin()` e preserva as permissões de edição dos demais campos.
- As páginas públicas já filtram os registros de animação por `is_published`; a rota de tópico retorna para a biblioteca quando não há animação publicada.

## Totais por área

| Área | Total | Com simulação existente (aguardando validação) | Planejados |
|---|---:|---:|---:|
| Mecânica | 96 | 10 | 86 |
| Ondulatória e acústica | 42 | 1 | 41 |
| Óptica | 51 | 5 | 46 |
| Termologia e termodinâmica | 41 | 1 | 40 |
| Eletricidade e eletromagnetismo | 90 | 3 | 87 |
| Física moderna, relatividade e física quântica | 60 | 0 | 60 |
| Física nuclear e de partículas | 30 | 0 | 30 |
| Astronomia e cosmologia | 35 | 0 | 35 |
| Física experimental e aplicada | 35 | 0 | 35 |

## Lista individual e estado

### Mecânica

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-001 | Referenciais e sistemas de coordenadas | Planejado | — |
| FIS-002 | Posição, deslocamento e trajetória | Planejado | — |
| FIS-003 | Distância percorrida | Planejado | — |
| FIS-004 | Velocidade média | Planejado | — |
| FIS-005 | Velocidade instantânea | Planejado | — |
| FIS-006 | Aceleração média | Planejado | — |
| FIS-007 | Aceleração instantânea | Planejado | — |
| FIS-008 | Movimento retilíneo uniforme | Implementado, aguardando validação | Movimento retilíneo uniforme |
| FIS-009 | Movimento retilíneo uniformemente variado | Implementado, aguardando validação | Movimento uniformemente variado |
| FIS-010 | Queda livre | Implementado, aguardando validação | Queda livre — comparação de massas |
| FIS-011 | Lançamento vertical | Planejado | — |
| FIS-012 | Lançamento horizontal | Planejado | — |
| FIS-013 | Lançamento oblíquo | Implementado, aguardando validação | Lançamento oblíquo |
| FIS-014 | Movimento circular uniforme | Planejado | — |
| FIS-015 | Movimento circular uniformemente variado | Planejado | — |
| FIS-016 | Velocidade angular | Planejado | — |
| FIS-017 | Aceleração centrípeta | Planejado | — |
| FIS-018 | Aceleração tangencial | Planejado | — |
| FIS-019 | Movimento relativo | Planejado | — |
| FIS-020 | Gráficos de posição, velocidade e aceleração | Planejado | — |
| FIS-021 | Leis de Newton | Implementado, aguardando validação | Segunda lei de Newton e atrito |
| FIS-022 | Inércia | Planejado | — |
| FIS-023 | Força resultante | Implementado, aguardando validação | Segunda lei de Newton e atrito |
| FIS-024 | Peso e massa | Planejado | — |
| FIS-025 | Força normal | Planejado | — |
| FIS-026 | Tração | Planejado | — |
| FIS-027 | Força elástica | Planejado | — |
| FIS-028 | Lei de Hooke | Planejado | — |
| FIS-029 | Atrito estático | Planejado | — |
| FIS-030 | Atrito cinético | Planejado | — |
| FIS-031 | Plano inclinado | Planejado | — |
| FIS-032 | Sistemas de blocos | Planejado | — |
| FIS-033 | Polias fixas e móveis | Planejado | — |
| FIS-034 | Máquina de Atwood | Planejado | — |
| FIS-035 | Dinâmica do movimento circular | Planejado | — |
| FIS-036 | Curvas inclinadas | Planejado | — |
| FIS-037 | Pêndulo cônico | Planejado | — |
| FIS-038 | Força de resistência do ar | Planejado | — |
| FIS-039 | Velocidade terminal | Planejado | — |
| FIS-040 | Trabalho de uma força constante | Planejado | — |
| FIS-041 | Trabalho de uma força variável | Planejado | — |
| FIS-042 | Energia cinética | Planejado | — |
| FIS-043 | Energia potencial gravitacional | Planejado | — |
| FIS-044 | Energia potencial elástica | Planejado | — |
| FIS-045 | Conservação da energia mecânica | Implementado, aguardando validação | Conservação da energia na rampa |
| FIS-046 | Transformações de energia | Planejado | — |
| FIS-047 | Potência mecânica | Planejado | — |
| FIS-048 | Rendimento de máquinas | Planejado | — |
| FIS-049 | Impulso | Planejado | — |
| FIS-050 | Quantidade de movimento | Planejado | — |
| FIS-051 | Conservação da quantidade de movimento | Planejado | — |
| FIS-052 | Colisões elásticas | Implementado, aguardando validação | Colisão entre carrinhos |
| FIS-053 | Colisões inelásticas | Planejado | — |
| FIS-054 | Colisões bidimensionais | Planejado | — |
| FIS-055 | Centro de massa | Planejado | — |
| FIS-056 | Sistemas de partículas | Planejado | — |
| FIS-057 | Torque | Planejado | — |
| FIS-058 | Equilíbrio translacional | Planejado | — |
| FIS-059 | Equilíbrio rotacional | Planejado | — |
| FIS-060 | Alavancas | Planejado | — |
| FIS-061 | Centro de gravidade | Planejado | — |
| FIS-062 | Momento de inércia | Planejado | — |
| FIS-063 | Rotação de corpos rígidos | Planejado | — |
| FIS-064 | Energia cinética de rotação | Planejado | — |
| FIS-065 | Rolamento sem deslizamento | Planejado | — |
| FIS-066 | Conservação do momento angular | Planejado | — |
| FIS-067 | Precessão de giroscópios | Planejado | — |
| FIS-068 | Gravitação universal | Planejado | — |
| FIS-069 | Campo gravitacional | Planejado | — |
| FIS-070 | Energia potencial gravitacional newtoniana | Planejado | — |
| FIS-071 | Órbitas circulares | Planejado | — |
| FIS-072 | Órbitas elípticas | Planejado | — |
| FIS-073 | Leis de Kepler | Planejado | — |
| FIS-074 | Velocidade orbital | Planejado | — |
| FIS-075 | Velocidade de escape | Planejado | — |
| FIS-076 | Satélites artificiais | Planejado | — |
| FIS-077 | Órbitas geoestacionárias | Planejado | — |
| FIS-078 | Marés gravitacionais | Planejado | — |
| FIS-079 | Movimento de dois corpos | Planejado | — |
| FIS-080 | Problema de três corpos | Planejado | — |
| FIS-081 | Oscilações harmônicas | Planejado | — |
| FIS-082 | Movimento harmônico simples | Planejado | — |
| FIS-083 | Sistema massa-mola | Implementado, aguardando validação | Oscilador massa-mola |
| FIS-084 | Pêndulo simples | Implementado, aguardando validação | Pêndulo simples |
| FIS-085 | Pêndulo físico | Planejado | — |
| FIS-086 | Pêndulo amortecido | Planejado | — |
| FIS-087 | Oscilações forçadas | Planejado | — |
| FIS-088 | Ressonância mecânica | Planejado | — |
| FIS-089 | Superposição de oscilações | Planejado | — |
| FIS-090 | Movimento caótico | Planejado | — |
| FIS-091 | Fluidos em repouso | Planejado | — |
| FIS-092 | Pressão hidrostática | Planejado | — |
| FIS-093 | Princípio de Pascal | Planejado | — |
| FIS-094 | Empuxo e princípio de Arquimedes | Planejado | — |
| FIS-095 | Equação da continuidade | Planejado | — |
| FIS-096 | Equação de Bernoulli | Planejado | — |

### Ondulatória e acústica

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-097 | Movimento ondulatório | Planejado | — |
| FIS-098 | Ondas transversais | Planejado | — |
| FIS-099 | Ondas longitudinais | Planejado | — |
| FIS-100 | Comprimento de onda | Planejado | — |
| FIS-101 | Frequência | Planejado | — |
| FIS-102 | Período | Planejado | — |
| FIS-103 | Amplitude | Planejado | — |
| FIS-104 | Velocidade de propagação | Planejado | — |
| FIS-105 | Ondas em cordas | Implementado, aguardando validação | Onda transversal em uma corda |
| FIS-106 | Ondas em molas | Planejado | — |
| FIS-107 | Ondas na superfície de líquidos | Planejado | — |
| FIS-108 | Ondas sonoras | Planejado | — |
| FIS-109 | Intensidade sonora | Planejado | — |
| FIS-110 | Nível sonoro em decibéis | Planejado | — |
| FIS-111 | Altura e frequência do som | Planejado | — |
| FIS-112 | Timbre e composição harmônica | Planejado | — |
| FIS-113 | Efeito Doppler | Planejado | — |
| FIS-114 | Interferência construtiva | Planejado | — |
| FIS-115 | Interferência destrutiva | Planejado | — |
| FIS-116 | Princípio da superposição | Planejado | — |
| FIS-117 | Batimentos | Planejado | — |
| FIS-118 | Ondas estacionárias | Planejado | — |
| FIS-119 | Harmônicos em cordas | Planejado | — |
| FIS-120 | Tubos sonoros abertos | Planejado | — |
| FIS-121 | Tubos sonoros fechados | Planejado | — |
| FIS-122 | Ressonância acústica | Planejado | — |
| FIS-123 | Difração de ondas | Planejado | — |
| FIS-124 | Reflexão de ondas | Planejado | — |
| FIS-125 | Refração de ondas | Planejado | — |
| FIS-126 | Polarização de ondas transversais | Planejado | — |
| FIS-127 | Ondas eletromagnéticas | Planejado | — |
| FIS-128 | Espectro eletromagnético | Planejado | — |
| FIS-129 | Velocidade da luz | Planejado | — |
| FIS-130 | Ondas de rádio | Planejado | — |
| FIS-131 | Micro-ondas | Planejado | — |
| FIS-132 | Infravermelho | Planejado | — |
| FIS-133 | Luz visível | Planejado | — |
| FIS-134 | Ultravioleta | Planejado | — |
| FIS-135 | Raios X | Planejado | — |
| FIS-136 | Raios gama | Planejado | — |
| FIS-137 | Interferência de ondas luminosas | Planejado | — |
| FIS-138 | Difração da luz | Planejado | — |

### Óptica

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-139 | Propagação retilínea da luz | Planejado | — |
| FIS-140 | Fontes luminosas | Planejado | — |
| FIS-141 | Feixes luminosos | Planejado | — |
| FIS-142 | Sombras e penumbras | Planejado | — |
| FIS-143 | Eclipses | Planejado | — |
| FIS-144 | Câmara escura | Planejado | — |
| FIS-145 | Reflexão da luz | Planejado | — |
| FIS-146 | Leis da reflexão | Implementado, aguardando validação | Reflexão em espelho plano |
| FIS-147 | Espelhos planos | Planejado | — |
| FIS-148 | Associação de espelhos planos | Planejado | — |
| FIS-149 | Espelhos esféricos côncavos | Implementado, aguardando validação | Espelho côncavo esférico |
| FIS-150 | Espelhos esféricos convexos | Implementado, aguardando validação | Espelho convexo esférico |
| FIS-151 | Formação de imagens em espelhos | Planejado | — |
| FIS-152 | Equação dos espelhos | Planejado | — |
| FIS-153 | Aumento linear transversal | Planejado | — |
| FIS-154 | Refração da luz | Planejado | — |
| FIS-155 | Índice de refração | Planejado | — |
| FIS-156 | Lei de Snell-Descartes | Implementado, aguardando validação | Refração e reflexão total |
| FIS-157 | Reflexão total interna | Planejado | — |
| FIS-158 | Ângulo limite | Planejado | — |
| FIS-159 | Dispersão da luz | Planejado | — |
| FIS-160 | Prismas ópticos | Planejado | — |
| FIS-161 | Fibras ópticas | Planejado | — |
| FIS-162 | Lentes convergentes | Implementado, aguardando validação | Lente delgada convergente |
| FIS-163 | Lentes divergentes | Planejado | — |
| FIS-164 | Equação das lentes delgadas | Planejado | — |
| FIS-165 | Vergência de lentes | Planejado | — |
| FIS-166 | Formação de imagens em lentes | Planejado | — |
| FIS-167 | Associação de lentes | Planejado | — |
| FIS-168 | Instrumentos ópticos | Planejado | — |
| FIS-169 | Olho humano | Planejado | — |
| FIS-170 | Miopia | Planejado | — |
| FIS-171 | Hipermetropia | Planejado | — |
| FIS-172 | Astigmatismo | Planejado | — |
| FIS-173 | Presbiopia | Planejado | — |
| FIS-174 | Lupa | Planejado | — |
| FIS-175 | Microscópio | Planejado | — |
| FIS-176 | Luneta astronômica | Planejado | — |
| FIS-177 | Telescópios refletores | Planejado | — |
| FIS-178 | Aberração cromática | Planejado | — |
| FIS-179 | Aberração esférica | Planejado | — |
| FIS-180 | Interferômetro de dupla fenda | Planejado | — |
| FIS-181 | Experimento de Young | Planejado | — |
| FIS-182 | Redes de difração | Planejado | — |
| FIS-183 | Polarização da luz | Planejado | — |
| FIS-184 | Lei de Malus | Planejado | — |
| FIS-185 | Espalhamento da luz | Planejado | — |
| FIS-186 | Efeito Tyndall | Planejado | — |
| FIS-187 | Fotometria | Planejado | — |
| FIS-188 | Radiometria | Planejado | — |
| FIS-189 | Formação de cores | Planejado | — |

### Termologia e termodinâmica

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-190 | Temperatura e equilíbrio térmico | Planejado | — |
| FIS-191 | Escalas Celsius, Fahrenheit e Kelvin | Planejado | — |
| FIS-192 | Dilatação linear | Planejado | — |
| FIS-193 | Dilatação superficial | Planejado | — |
| FIS-194 | Dilatação volumétrica | Planejado | — |
| FIS-195 | Dilatação de líquidos | Planejado | — |
| FIS-196 | Calor e energia interna | Planejado | — |
| FIS-197 | Calor específico | Planejado | — |
| FIS-198 | Capacidade térmica | Planejado | — |
| FIS-199 | Calorimetria | Implementado, aguardando validação | Trocas de calor |
| FIS-200 | Mudanças de estado físico | Planejado | — |
| FIS-201 | Calor latente | Planejado | — |
| FIS-202 | Curvas de aquecimento e resfriamento | Planejado | — |
| FIS-203 | Condução térmica | Planejado | — |
| FIS-204 | Convecção térmica | Planejado | — |
| FIS-205 | Radiação térmica | Planejado | — |
| FIS-206 | Lei de Fourier | Planejado | — |
| FIS-207 | Gases ideais | Planejado | — |
| FIS-208 | Equação de estado dos gases ideais | Planejado | — |
| FIS-209 | Transformações isotérmicas | Planejado | — |
| FIS-210 | Transformações isobáricas | Planejado | — |
| FIS-211 | Transformações isocóricas | Planejado | — |
| FIS-212 | Transformações adiabáticas | Planejado | — |
| FIS-213 | Diagramas pressão-volume | Planejado | — |
| FIS-214 | Trabalho de um gás | Planejado | — |
| FIS-215 | Primeira lei da termodinâmica | Planejado | — |
| FIS-216 | Segunda lei da termodinâmica | Planejado | — |
| FIS-217 | Entropia | Planejado | — |
| FIS-218 | Máquinas térmicas | Planejado | — |
| FIS-219 | Ciclo de Carnot | Planejado | — |
| FIS-220 | Refrigeradores e bombas de calor | Planejado | — |
| FIS-221 | Rendimento termodinâmico | Planejado | — |
| FIS-222 | Processos reversíveis e irreversíveis | Planejado | — |
| FIS-223 | Teoria cinética dos gases | Planejado | — |
| FIS-224 | Distribuição de velocidades moleculares | Planejado | — |
| FIS-225 | Movimento browniano | Planejado | — |
| FIS-226 | Pressão e colisões moleculares | Planejado | — |
| FIS-227 | Transferência de calor em materiais | Planejado | — |
| FIS-228 | Efeito estufa e balanço térmico | Planejado | — |
| FIS-229 | Termodinâmica de sistemas abertos | Planejado | — |
| FIS-230 | Flutuações térmicas e introdução à mecânica estatística | Planejado | — |

### Eletricidade e eletromagnetismo

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-231 | Carga elétrica | Planejado | — |
| FIS-232 | Eletrização por atrito | Planejado | — |
| FIS-233 | Eletrização por contato | Planejado | — |
| FIS-234 | Eletrização por indução | Planejado | — |
| FIS-235 | Condutores e isolantes | Planejado | — |
| FIS-236 | Lei de Coulomb | Planejado | — |
| FIS-237 | Princípio da superposição elétrica | Planejado | — |
| FIS-238 | Campo elétrico de cargas pontuais | Implementado, aguardando validação | Campo elétrico de duas cargas |
| FIS-239 | Campo elétrico de sistemas de cargas | Planejado | — |
| FIS-240 | Linhas de campo elétrico | Planejado | — |
| FIS-241 | Dipolos elétricos | Planejado | — |
| FIS-242 | Movimento de cargas em campos elétricos | Planejado | — |
| FIS-243 | Fluxo elétrico | Planejado | — |
| FIS-244 | Lei de Gauss | Planejado | — |
| FIS-245 | Potencial elétrico | Planejado | — |
| FIS-246 | Diferença de potencial | Planejado | — |
| FIS-247 | Superfícies equipotenciais | Planejado | — |
| FIS-248 | Energia potencial elétrica | Planejado | — |
| FIS-249 | Capacitores | Planejado | — |
| FIS-250 | Capacitância | Planejado | — |
| FIS-251 | Capacitores em série | Planejado | — |
| FIS-252 | Capacitores em paralelo | Planejado | — |
| FIS-253 | Dielétricos | Planejado | — |
| FIS-254 | Energia armazenada em capacitores | Planejado | — |
| FIS-255 | Corrente elétrica | Planejado | — |
| FIS-256 | Corrente contínua | Planejado | — |
| FIS-257 | Corrente alternada | Planejado | — |
| FIS-258 | Tensão elétrica | Planejado | — |
| FIS-259 | Resistência elétrica | Planejado | — |
| FIS-260 | Resistividade e condutividade | Planejado | — |
| FIS-261 | Lei de Ohm | Implementado, aguardando validação | Lei de Ohm |
| FIS-262 | Resistores em série | Planejado | — |
| FIS-263 | Resistores em paralelo | Planejado | — |
| FIS-264 | Circuitos mistos | Planejado | — |
| FIS-265 | Potência elétrica | Planejado | — |
| FIS-266 | Energia elétrica consumida | Planejado | — |
| FIS-267 | Efeito Joule | Planejado | — |
| FIS-268 | Força eletromotriz | Planejado | — |
| FIS-269 | Resistência interna de geradores | Planejado | — |
| FIS-270 | Receptores elétricos | Planejado | — |
| FIS-271 | Leis de Kirchhoff | Planejado | — |
| FIS-272 | Divisores de tensão | Planejado | — |
| FIS-273 | Divisores de corrente | Planejado | — |
| FIS-274 | Circuitos RC | Planejado | — |
| FIS-275 | Carga de capacitores | Planejado | — |
| FIS-276 | Descarga de capacitores | Planejado | — |
| FIS-277 | Constante de tempo RC | Planejado | — |
| FIS-278 | Circuitos RL | Planejado | — |
| FIS-279 | Circuitos RLC | Planejado | — |
| FIS-280 | Ressonância elétrica | Planejado | — |
| FIS-281 | Impedância | Planejado | — |
| FIS-282 | Reatância capacitiva | Planejado | — |
| FIS-283 | Reatância indutiva | Planejado | — |
| FIS-284 | Potência em corrente alternada | Planejado | — |
| FIS-285 | Fator de potência | Planejado | — |
| FIS-286 | Campo magnético | Planejado | — |
| FIS-287 | Campo magnético de um fio retilíneo | Planejado | — |
| FIS-288 | Campo magnético de uma espira | Planejado | — |
| FIS-289 | Campo magnético de uma bobina | Planejado | — |
| FIS-290 | Força magnética sobre cargas | Planejado | — |
| FIS-291 | Movimento de cargas em campos magnéticos | Planejado | — |
| FIS-292 | Força magnética sobre fios com corrente | Planejado | — |
| FIS-293 | Torque magnético | Planejado | — |
| FIS-294 | Dipolos magnéticos | Planejado | — |
| FIS-295 | Lei de Biot-Savart | Planejado | — |
| FIS-296 | Lei de Ampère | Planejado | — |
| FIS-297 | Fluxo magnético | Planejado | — |
| FIS-298 | Indução eletromagnética | Planejado | — |
| FIS-299 | Lei de Faraday | Implementado, aguardando validação | Indução eletromagnética — piloto dedicado 2D/3D |
| FIS-300 | Lei de Lenz | Planejado | — |
| FIS-301 | Força eletromotriz induzida | Planejado | — |
| FIS-302 | Geradores elétricos | Planejado | — |
| FIS-303 | Motores elétricos | Planejado | — |
| FIS-304 | Transformadores | Planejado | — |
| FIS-305 | Indutância | Planejado | — |
| FIS-306 | Energia armazenada em indutores | Planejado | — |
| FIS-307 | Eletroímãs | Planejado | — |
| FIS-308 | Relés eletromagnéticos | Planejado | — |
| FIS-309 | Alto-falantes | Planejado | — |
| FIS-310 | Microfones | Planejado | — |
| FIS-311 | Ondas eletromagnéticas | Planejado | — |
| FIS-312 | Equações de Maxwell: introdução | Planejado | — |
| FIS-313 | Propagação de ondas eletromagnéticas | Planejado | — |
| FIS-314 | Antenas | Planejado | — |
| FIS-315 | Circuitos de transmissão | Planejado | — |
| FIS-316 | Efeito Hall | Planejado | — |
| FIS-317 | Plasma e condução elétrica | Planejado | — |
| FIS-318 | Semicondutores | Planejado | — |
| FIS-319 | Diodos e retificação | Planejado | — |
| FIS-320 | Transistores e amplificação | Planejado | — |

### Física moderna, relatividade e física quântica

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-321 | Radiação de corpo negro | Planejado | — |
| FIS-322 | Catástrofe do ultravioleta | Planejado | — |
| FIS-323 | Hipótese de Planck | Planejado | — |
| FIS-324 | Fótons | Planejado | — |
| FIS-325 | Efeito fotoelétrico | Planejado | — |
| FIS-326 | Efeito Compton | Planejado | — |
| FIS-327 | Dualidade onda-partícula | Planejado | — |
| FIS-328 | Hipótese de de Broglie | Planejado | — |
| FIS-329 | Difração de elétrons | Planejado | — |
| FIS-330 | Experimento de dupla fenda quântica | Planejado | — |
| FIS-331 | Princípio da incerteza de Heisenberg | Planejado | — |
| FIS-332 | Função de onda | Planejado | — |
| FIS-333 | Interpretação probabilística da função de onda | Planejado | — |
| FIS-334 | Equação de Schrödinger | Planejado | — |
| FIS-335 | Poço de potencial quântico | Planejado | — |
| FIS-336 | Barreira de potencial e tunelamento | Planejado | — |
| FIS-337 | Oscilador harmônico quântico | Planejado | — |
| FIS-338 | Quantização da energia | Planejado | — |
| FIS-339 | Átomo de hidrogênio | Planejado | — |
| FIS-340 | Orbitais atômicos | Planejado | — |
| FIS-341 | Números quânticos | Planejado | — |
| FIS-342 | Princípio da exclusão de Pauli | Planejado | — |
| FIS-343 | Spin | Planejado | — |
| FIS-344 | Momento angular quântico | Planejado | — |
| FIS-345 | Átomos multieletrônicos: introdução | Planejado | — |
| FIS-346 | Espectros atômicos | Planejado | — |
| FIS-347 | Emissão e absorção de fótons | Planejado | — |
| FIS-348 | Lasers | Planejado | — |
| FIS-349 | Fluorescência | Planejado | — |
| FIS-350 | Fosforescência | Planejado | — |
| FIS-351 | Relatividade especial | Planejado | — |
| FIS-352 | Postulados de Einstein | Planejado | — |
| FIS-353 | Simultaneidade relativa | Planejado | — |
| FIS-354 | Dilatação temporal | Planejado | — |
| FIS-355 | Contração do comprimento | Planejado | — |
| FIS-356 | Transformações de Lorentz | Planejado | — |
| FIS-357 | Composição relativística de velocidades | Planejado | — |
| FIS-358 | Energia relativística | Planejado | — |
| FIS-359 | Equivalência massa-energia | Planejado | — |
| FIS-360 | Momento relativístico | Planejado | — |
| FIS-361 | Diagramas espaço-tempo | Planejado | — |
| FIS-362 | Cone de luz | Planejado | — |
| FIS-363 | Intervalo espaço-temporal | Planejado | — |
| FIS-364 | Relatividade geral: introdução | Planejado | — |
| FIS-365 | Princípio da equivalência | Planejado | — |
| FIS-366 | Curvatura do espaço-tempo | Planejado | — |
| FIS-367 | Geodésicas | Planejado | — |
| FIS-368 | Desvio gravitacional da luz | Planejado | — |
| FIS-369 | Lentes gravitacionais | Planejado | — |
| FIS-370 | Dilatação gravitacional do tempo | Planejado | — |
| FIS-371 | Ondas gravitacionais | Planejado | — |
| FIS-372 | Buracos negros | Planejado | — |
| FIS-373 | Horizonte de eventos | Planejado | — |
| FIS-374 | Buracos negros de Schwarzschild | Planejado | — |
| FIS-375 | Buracos negros de Kerr | Planejado | — |
| FIS-376 | Ergosfera | Planejado | — |
| FIS-377 | Arrastamento de referenciais | Planejado | — |
| FIS-378 | Processo de Penrose | Planejado | — |
| FIS-379 | Radiação Hawking: modelo conceitual | Planejado | — |
| FIS-380 | Cosmologia relativística: introdução | Planejado | — |

### Física nuclear e de partículas

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-381 | Estrutura do núcleo atômico | Planejado | — |
| FIS-382 | Prótons e nêutrons | Planejado | — |
| FIS-383 | Isótopos | Planejado | — |
| FIS-384 | Defeito de massa | Planejado | — |
| FIS-385 | Energia de ligação nuclear | Planejado | — |
| FIS-386 | Estabilidade nuclear | Planejado | — |
| FIS-387 | Decaimento alfa | Planejado | — |
| FIS-388 | Decaimento beta | Planejado | — |
| FIS-389 | Decaimento gama | Planejado | — |
| FIS-390 | Meia-vida radioativa | Planejado | — |
| FIS-391 | Séries de decaimento | Planejado | — |
| FIS-392 | Lei do decaimento radioativo | Planejado | — |
| FIS-393 | Fissão nuclear | Planejado | — |
| FIS-394 | Fusão nuclear | Planejado | — |
| FIS-395 | Reatores nucleares: modelo didático | Planejado | — |
| FIS-396 | Reações nucleares | Planejado | — |
| FIS-397 | Detectores de partículas: simulação | Planejado | — |
| FIS-398 | Interação da radiação com a matéria | Planejado | — |
| FIS-399 | Dosimetria: modelos conceituais seguros | Planejado | — |
| FIS-400 | Raios cósmicos | Planejado | — |
| FIS-401 | Modelo padrão das partículas | Planejado | — |
| FIS-402 | Quarks | Planejado | — |
| FIS-403 | Léptons | Planejado | — |
| FIS-404 | Bósons mediadores | Planejado | — |
| FIS-405 | Interações fundamentais | Planejado | — |
| FIS-406 | Diagramas de Feynman: introdução | Planejado | — |
| FIS-407 | Antimatéria | Planejado | — |
| FIS-408 | Neutrinos | Planejado | — |
| FIS-409 | Aceleradores de partículas | Planejado | — |
| FIS-410 | Conservação de energia, carga e momento em colisões de partículas | Planejado | — |

### Astronomia e cosmologia

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-411 | Sistema Solar | Planejado | — |
| FIS-412 | Leis de Kepler aplicadas aos planetas | Planejado | — |
| FIS-413 | Gravitação planetária | Planejado | — |
| FIS-414 | Fases da Lua | Planejado | — |
| FIS-415 | Eclipses solares | Planejado | — |
| FIS-416 | Eclipses lunares | Planejado | — |
| FIS-417 | Estações do ano | Planejado | — |
| FIS-418 | Movimento aparente do céu | Planejado | — |
| FIS-419 | Coordenadas celestes | Planejado | — |
| FIS-420 | Paralaxe estelar | Planejado | — |
| FIS-421 | Distâncias astronômicas | Planejado | — |
| FIS-422 | Luminosidade e fluxo | Planejado | — |
| FIS-423 | Magnitude aparente e absoluta | Planejado | — |
| FIS-424 | Espectros estelares | Planejado | — |
| FIS-425 | Diagrama Hertzsprung-Russell | Planejado | — |
| FIS-426 | Evolução estelar | Planejado | — |
| FIS-427 | Formação de estrelas | Planejado | — |
| FIS-428 | Anãs brancas | Planejado | — |
| FIS-429 | Estrelas de nêutrons | Planejado | — |
| FIS-430 | Pulsares | Planejado | — |
| FIS-431 | Supernovas | Planejado | — |
| FIS-432 | Buracos negros astrofísicos | Planejado | — |
| FIS-433 | Galáxias | Planejado | — |
| FIS-434 | Curvas de rotação galáctica | Planejado | — |
| FIS-435 | Matéria escura: modelos conceituais | Planejado | — |
| FIS-436 | Energia escura: modelos conceituais | Planejado | — |
| FIS-437 | Expansão do Universo | Planejado | — |
| FIS-438 | Lei de Hubble-Lemaître | Planejado | — |
| FIS-439 | Radiação cósmica de fundo | Planejado | — |
| FIS-440 | Big Bang | Planejado | — |
| FIS-441 | Nucleossíntese primordial | Planejado | — |
| FIS-442 | Formação de estruturas cósmicas | Planejado | — |
| FIS-443 | Ondas gravitacionais em astronomia | Planejado | — |
| FIS-444 | Detecção de exoplanetas | Planejado | — |
| FIS-445 | Habitabilidade planetária: modelos físicos | Planejado | — |

### Física experimental e aplicada

| ID | Tópico | Estado | Simulação relacionada |
|---|---|---|---|
| FIS-446 | Algarismos significativos e incertezas | Planejado | — |
| FIS-447 | Erros sistemáticos e aleatórios | Planejado | — |
| FIS-448 | Propagação de incertezas | Planejado | — |
| FIS-449 | Ajuste linear de dados experimentais | Planejado | — |
| FIS-450 | Regressão não linear | Planejado | — |
| FIS-451 | Análise dimensional | Planejado | — |
| FIS-452 | Calibração de instrumentos | Planejado | — |
| FIS-453 | Cronometragem de movimentos | Planejado | — |
| FIS-454 | Medição de aceleração | Planejado | — |
| FIS-455 | Sensores de posição e velocidade | Planejado | — |
| FIS-456 | Sensores de temperatura | Planejado | — |
| FIS-457 | Sensores de pressão | Planejado | — |
| FIS-458 | Sensores de força | Planejado | — |
| FIS-459 | Aquisição de dados | Planejado | — |
| FIS-460 | Construção e interpretação de gráficos | Planejado | — |
| FIS-461 | Comparação entre modelo teórico e dados | Planejado | — |
| FIS-462 | Simulação de experimentos com ruído | Planejado | — |
| FIS-463 | Método de Monte Carlo | Planejado | — |
| FIS-464 | Propagação de ondas em meios complexos | Planejado | — |
| FIS-465 | Materiais elásticos e viscoelásticos | Planejado | — |
| FIS-466 | Resistência dos materiais | Planejado | — |
| FIS-467 | Vibrações estruturais | Planejado | — |
| FIS-468 | Ressonância em estruturas | Planejado | — |
| FIS-469 | Mecânica dos fluidos aplicada | Planejado | — |
| FIS-470 | Aerodinâmica | Planejado | — |
| FIS-471 | Sustentação e arrasto | Planejado | — |
| FIS-472 | Transferência de calor aplicada | Planejado | — |
| FIS-473 | Eficiência energética | Planejado | — |
| FIS-474 | Energia solar fotovoltaica | Planejado | — |
| FIS-475 | Energia solar térmica | Planejado | — |
| FIS-476 | Energia eólica | Planejado | — |
| FIS-477 | Indução eletromagnética aplicada | Planejado | — |
| FIS-478 | Sensores e transdutores | Planejado | — |
| FIS-479 | Instrumentação eletrônica | Planejado | — |
| FIS-480 | Projeto experimental integrador | Planejado | — |

## Testes e comprovações desta etapa

Em 11/10/2026, antes deste lote, a suíte automatizada executou **53 testes e todos passaram**, cobrindo os modelos físicos e páginas existentes até então, o modelo analítico do piloto de Faraday, a integridade dos 480 registros, filtros e links do catálogo, e verificações estruturais do painel e do trigger. Não foi executada uma nova suíte nesta publicação. A verificação de sintaxe dos módulos do painel e do piloto também passou. O piloto de Faraday tem página própria, vista 2D e 3D, controle de perspectiva, gráfico, grandezas, parâmetros, tela cheia e indicação das limitações do modelo; aguarda validação visual no navegador. A página de queda livre também aguarda validação visual e não recebeu uma suíte de testes nesta publicação. Esses testes de código não substituem uma checagem visual no navegador nem um teste de autorização com uma conta comum e uma conta administradora. Esses dois fluxos de ponta a ponta continuam pendentes porque não foi feita uma alteração real nos registros do banco nem foram fornecidas contas de teste. A publicação na biblioteca e o bloqueio de página direta seguem as consultas existentes filtradas por `is_published`; a verificação pública após o deploy ainda precisa ser feita no navegador.

## Requisitos preservados do prompt mestre

O catálogo mantém estes campos por registro: identificador permanente, slug, título, área, subárea, descrição, objetivos de aprendizagem, dificuldade, tipo de simulação, estado, modelo físico, interface, interações, equações, variáveis, unidades SI, referências, testes de validação e limitações. Campos sem definição no texto fonte ou sem validação no site ficam explícitos como não definidos; não são preenchidos com dados inventados. A página permite busca por nome/número e filtros por área e estado; subárea e dificuldade listam os valores cadastrados, sem extrapolar metadados ausentes nos demais assuntos.

A implementação futura seguirá as etapas solicitadas, nesta ordem: (1) auditoria da arquitetura e do que existe; (2) planejamento e mapeamento dos 480 assuntos, modelos e testes; (3) componentes reutilizáveis de simulação, controles, gráficos, instrumentos, dados, roteiro de experiência, perguntas, histórico e exportação; (4) validação dos pilotos de mecânica, ondas, óptica, termodinâmica, circuitos e eletromagnetismo; (5) expansão por lotes pequenos; (6) modelos conceituais de física moderna, relatividade, núcleo, partículas, astronomia e cosmologia; (7) ferramentas de medição, incerteza, ajuste e comparação de dados; (8) acessibilidade, responsividade e desempenho; (9) validação integral; (10) documentação de arquitetura, modelos, limitações, testes e manutenção.

Critérios científicos preservados: declarar hipóteses e condições de contorno; usar equações e unidades coerentes; diferenciar o modelo ideal do real; validar contra soluções analíticas, casos conhecidos ou referências confiáveis; registrar erros, incertezas e limitações quando cabível; não distorcer resultados para fins visuais; e identificar claramente uma representação conceitual quando não houver simulação numérica validada. As visualizações devem explicar convenções abstratas, como raios ou partículas.

Cada laboratório deverá adaptar a representação ao domínio: corpos, forças e órbitas na mecânica; propagação, interferência e difração em ondas; raios e formação de imagens em óptica; movimento de partículas e diagramas em termologia; cargas, circuitos e medições em eletricidade; indução, motores e campos em eletromagnetismo; visualizações conceituais em física moderna e nuclear; escalas e evolução em astronomia; e instrumentos e incerteza em física experimental.

Quando pertinente, os laboratórios terão iniciar/pausar/continuar/reiniciar, velocidade e navegação temporal, parâmetros, vetores/campos, camadas visuais, medições, gráficos sincronizados, restauração de valores e alternância 2D/3D. A estrutura deve permitir modo guiado e livre, hipóteses, comparação entre previsão e simulação, registro/exportação de dados, explicações, referências e acompanhamento do professor. Os testes futuros cobrem catálogo completo e unicidade, navegação, controles, grandezas, gráficos, equações, limites, telas, acessibilidade, console e regressões.

Acessibilidade e desempenho incluem teclado, leitores de tela, legendas e descrições, textos organizados, passos opcionais, exploração livre, velocidade reduzida, redução de movimento, controle de sons/efeitos, contraste e densidade configuráveis, não depender só de cor, participação docente e não presumir uma necessidade comum a todos os estudantes autistas. As animações devem pausar quando apropriado e considerar dispositivos modestos; erros em uma simulação não podem bloquear o restante do catálogo.

## Próximos lotes

1. Validar visualmente no navegador o primeiro grupo de cinco laboratórios e documentar equações, grandezas SI, condições iniciais, acessibilidade e limitações.
2. Implementar os tópicos seguintes em lotes pequenos, com modelo físico próprio e testes de caso conhecido.
3. Atualizar o estado por tópico somente após executar os testes correspondentes e revisar o comportamento real.
4. Não publicar um tópico planejado até haver uma experiência funcional e revisada.


## Publicação dos 25 laboratórios prioritários

Em 11/10/2026, o percurso prioritário foi completado com cinco grupos de cinco itens. Os 16 itens que já tinham experimentos mantêm seus links individuais; nove simulações 2D novas foram adicionadas para atrito e plano inclinado, movimento circular, hidrostática e empuxo, gases ideais, ressonância acústica, efeito Doppler, interferência e difração, eletroímãs e meia-vida. Cada nova página tem controles, animação, gráfico e modo de tela cheia com painel lateral recolhível.

Os nove tópicos correspondentes no catálogo de 480 agora estão como **Implementado, aguardando validação**. Isso não significa validação científica completa: revisão visual em navegador e checagem independente de casos físicos ainda são necessárias. O percurso prioritário abre uma animação em cada um dos 25 itens.
