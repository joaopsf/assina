# Assina

Fluxo completo de assinatura de documentos, feito em **Vue 3 + TypeScript + Pinia + GraphQL**.

Você sobe um PDF, define quem assina e em que ordem, arrasta os campos de assinatura por cima das páginas, cada pessoa desenha a própria assinatura na vez dela e, no fim, baixa o PDF assinado com uma página de trilha de auditoria.

**[Ver funcionando](https://joaopsf.github.io/assina/)** · sem cadastro, com um contrato de exemplo pra testar em um clique.

> Projeto de portfólio. Não tem validade jurídica (ver [O que muda num produto real](#o-que-muda-num-produto-real)).

## O que dá pra fazer

- Enviar um PDF (ou gerar um contrato de exemplo) e calcular a impressão digital SHA-256 do arquivo original.
- Adicionar quem assina, com validação de e-mail e sem duplicados. A ordem de entrada é a ordem de assinatura.
- Clicar na página para criar o campo de cada pessoa, arrastar, redimensionar pelo canto e mover com as setas do teclado.
- Salvar sozinho enquanto edita. Depois de enviado, o documento trava para edição.
- Assinar desenhando com mouse, dedo ou caneta. O traço varia de espessura com a velocidade, e a imagem é recortada para encaixar bem no campo.
- Respeitar a ordem: quem abre o link antes da vez vê quem falta assinar.
- Acompanhar o progresso e o histórico de eventos, e baixar o PDF final com as assinaturas carimbadas e a página de auditoria.

## Decisões técnicas

**GraphQL para o dado de servidor, Pinia para o estado de tela.**
Documento, signatários, campos e eventos vêm do GraphQL (urql, com cache de documento). O Pinia guarda só o que é da interface: quem está selecionado, campos ainda não salvos e se houve alteração. Misturar os dois é a causa mais comum de estado dessincronizado em app Vue.

**O "servidor" GraphQL roda no navegador.**
Para a demo subir de graça no GitHub Pages, o `executeExchange` do urql executa as operações contra o schema local, com os dados no `localStorage`. O schema ([`schema.graphql.ts`](src/graphql/schema.graphql.ts)) e os resolvers ([`servidor.ts`](src/graphql/servidor.ts)) são os que iriam para o back-end. Para usar uma API real, basta tirar o `executeExchange` em [`cliente.ts`](src/graphql/cliente.ts) e apontar a URL.

**Regras de negócio sem framework.**
[`regras.ts`](src/graphql/regras.ts) não importa nada de GraphQL, Vue ou navegador. Ali ficam a ordem de assinatura, o bloqueio depois do envio, a validação de campos e o histórico. Isso deixa as regras testáveis direto e reaproveitáveis num servidor Node. Erros de regra viram `GraphQLError` com `extensions.code = REGRA_DE_NEGOCIO`, como uma API real faria.

**Coordenadas relativas.**
Os campos são guardados de 0 a 1 em relação à página, então funcionam em qualquer zoom ou tela. A conversão para o PDF (pontos, com o eixo Y invertido) fica isolada e testada em [`coordenadas.ts`](src/lib/coordenadas.ts), porque é ali que nasce o bug clássico de "assinatura no lugar errado".

**Leitura e escrita de PDF separadas.**
O pdf.js (leitura, com o trabalho pesado num Web Worker) carrega com o app. O pdf-lib (escrita) só baixa quando a pessoa gera o contrato de exemplo ou o PDF final, o que tira cerca de 177 KB (gzip) da abertura.

**Sem biblioteca onde não precisa.**
Arrastar e redimensionar campos, o quadro de assinatura, o IndexedDB e o SHA-256 (Web Crypto) são código próprio e curto. Cada dependência é uma escolha, não um atalho.

**Acessibilidade.**
Os campos recebem foco e se movem pelo teclado, o campo da pessoa da vez é um botão de verdade (Enter ou espaço assina), a barra de progresso tem `role="progressbar"` e as animações respeitam `prefers-reduced-motion`.

## Estrutura

```
src/
├── graphql/
│   ├── schema.graphql.ts   contrato da API (SDL)
│   ├── regras.ts           regras de negócio puras
│   ├── servidor.ts         resolvers + armazenamento
│   ├── cliente.ts          cliente urql
│   ├── operacoes.ts        queries, mutations e fragmentos
│   └── tipos.ts
├── stores/editor.ts        estado da tela de preparação (Pinia)
├── lib/
│   ├── pdf.ts              leitura e renderização (pdf.js)
│   ├── pdf-escrita.ts      contrato de exemplo e PDF assinado (pdf-lib, sob demanda)
│   ├── coordenadas.ts      tela ↔ PDF
│   ├── arquivos.ts         PDF original no IndexedDB
│   ├── hash.ts             SHA-256
│   └── usePdf.ts           composable que carrega o PDF do documento
├── components/             PaginaPdf, CampoAssinatura, QuadroAssinatura
└── views/                  Lista, Preparar, Assinar, Acompanhar
```

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run lint       # ESLint (Vue + TypeScript)
npm run build      # checagem de tipos + build
```

## Testes

28 testes em Vitest, focados onde o erro custa caro:

- **Regras** ([`regras.test.ts`](src/graphql/regras.test.ts)): ordem de assinatura, bloqueio depois do envio, campos fora da página, e-mail duplicado, conclusão e histórico.
- **API GraphQL** ([`servidor.test.ts`](src/graphql/servidor.test.ts)): o caminho inteiro (parse, validação do schema, resolvers), erros com código e campos calculados como `podeAssinar`.
- **Coordenadas** ([`coordenadas.test.ts`](src/lib/coordenadas.test.ts)): eixo Y invertido, limites da página e encaixe da imagem sem distorcer.
- **Editor** ([`editor.test.ts`](src/stores/editor.test.ts)): criação de campo no clique, limites e isolamento do estado carregado.

A cada push, o GitHub Actions roda lint, tipos, testes e build, e publica no GitHub Pages ([`ci.yml`](.github/workflows/ci.yml)).

## O que muda num produto real

- **Back-end de verdade:** o mesmo schema num servidor (Node com GraphQL Yoga, por exemplo), banco relacional e o PDF num armazenamento de objetos.
- **Identidade de quem assina:** link único com token de uso único por e-mail, mais um código por SMS ou WhatsApp. Aqui o botão "Abrir link" simula o e-mail.
- **Validade jurídica:** carimbo de tempo de uma autoridade confiável e, quando o caso pede, certificado ICP-Brasil (assinatura qualificada). Registro de IP e navegador de cada assinatura na trilha.
- **Integridade:** guardar o hash do PDF final também e assinar o arquivo digitalmente (PAdES), para que qualquer alteração depois seja detectável.
- **Notificações:** e-mail para a próxima pessoa da fila e webhook para o sistema do cliente quando o documento é concluído.

---

Feito por [João Paulo](https://joaopaulo.omniahub.com.br), dev front-end sênior.
