# Product

## Register

product

## Users

Um único usuário: o dono do projeto, músico. Usa em casa, sentado ao computador,
preparando repertório **antes** de tocar. Não usa a tela enquanto toca: a tela é a
oficina, o papel impresso é o que vai para a estante.

O trabalho concreto é: colar uma cifra copiada de algum site, ajustar o alinhamento dos
acordes sobre as sílabas, escolher os diagramas que entram na folha, acertar colunas e
corpo até caber bem na página, imprimir. Depois, reimprimir sem refazer nada.

Conhece o domínio a fundo (acordes, casas, pestana, capotraste). Não precisa de tutorial,
rótulo explicativo nem assistente passo a passo.

## Product Purpose

Substituir um arquivo HTML estático que formatava cifras para impressão, mantendo
exatamente a mesma saída impressa, mas com o material salvo: catálogo de acordes
reutilizável, músicas com várias versões, e a formatação de cada versão memorizada.

Sucesso é: reimprimir uma folha salva em menos de 30 segundos, sem recolar texto nem
reconfigurar nada, e a folha sair idêntica à anterior.

## Brand Personality

Editor técnico. Denso, direto, sem cerimônia. Três palavras: **preciso, discreto,
oficinal**.

A voz é de ferramenta de trabalho, não de produto de consumo. Rótulos dizem o que a
ação faz. Nenhum texto motivacional, nenhuma celebração, nenhuma personalidade postiça.
O silêncio da interface é a feature.

## Anti-references

- **SaaS genérico**: grades de cards idênticos, azul corporativo, sombras suaves,
  ilustração de mascote, espaçamento inflado.
- **Site de cifra com anúncio** (CifraClub e similares): poluído, hierarquia confusa,
  tudo competindo por atenção.
- **App de música gamificado** (Yousician, Duolingo): colorido, arredondado, badges,
  animação saltitante.
- **Documento do Word**: cinza chapado, sem hierarquia, controles de formatação
  espalhados numa barra de ferramentas sem ordem.

Ponto extra do usuário: gosta de tema escuro. O baseline `formatador-cifra.html` já
tinha painel de controle escuro e monoespaçado; a versão React perdeu isso.

## Design Principles

1. **A ferramenta não compete com o artefato.** A folha é a única coisa clara e quente
   da tela. Todo o resto recua. Se algo do chrome disputa atenção com a cifra, está
   errado.

2. **O papel é o produto, a tela é a oficina.** Otimizar para velocidade de edição e
   fidelidade de impressão, não para beleza de tela. A tela pode ser densa e feia-de-
   propósito se isso fizer a folha sair melhor.

3. **Densidade é respeito.** Usuário único e especialista. Não acolchoar, não esconder
   controle atrás de menu, não explicar o óbvio. Mais informação por pixel é a favor
   dele, não contra.

4. **Alinhamento é sagrado.** Monoespaçada e largura horizontal são requisitos
   funcionais, não escolha estética: acorde fica sobre a sílaba certa. O campo onde se
   edita a cifra nunca pode ser o elemento mais estreito da tela.

5. **Nada de enfeite que não seja estado.** Cor e movimento sinalizam estado (foco,
   erro, salvo, selecionado, bloqueado). Nunca decoração.

## Accessibility & Inclusion

Sem necessidade específica declarada. Segue o padrão:

- Contraste WCAG AA (4.5:1 corpo, 3:1 texto grande). Cinza claro sobre fundo claro é
  proibido para qualquer texto de leitura.
- Foco visível em todo elemento interativo. Hoje **não existe** estilo de foco: é a
  falha de acessibilidade mais grave do estado atual.
- Navegação por teclado funcional (o fluxo principal é digitação; o mouse é secundário).
- `prefers-reduced-motion` respeitado em qualquer transição.
- Alvo de clique mínimo 32px na interface densa (não é uso por toque).
