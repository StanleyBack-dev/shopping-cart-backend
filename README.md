# Shopping Cart — Backend

API REST que simula o funcionamento de um carrinho de compras: catálogo de produtos, itens do carrinho, cupons,
totais e finalização (checkout).

Construída com **NestJS**, **TypeScript**, **Prisma ORM** e **PostgreSQL**, seguindo um estilo de arquitetura em
camadas / clean architecture (domínio → aplicação → infraestrutura → apresentação) por módulo, para que as regras
de negócio fiquem independentes de detalhes de HTTP e persistência.

## Stack utilizada

- **NestJS 11** + **TypeScript** (strict)
- **Prisma ORM** + **PostgreSQL** (testado com [Neon](https://neon.tech))
- **class-validator** / **class-transformer** para validação das requisições
- **Swagger / OpenAPI** para documentação da API
- **Jest** para testes unitários e end-to-end
- **Docker** / **docker-compose** para rodar o projeto containerizado
- ESLint (flat config) + Prettier + Husky + lint-staged

## Arquitetura

Cada módulo de negócio (`products`, `coupons`, `cart`) é organizado em quatro camadas:

```
src/modules/<module>/
├── domain/            # Entidades e regras de negócio — sem imports de framework/ORM
│   ├── entities/
│   └── enums/
├── application/        # Casos de uso + "ports" (interfaces) de repositório
│   ├── use-cases/
│   └── ports/
├── infrastructure/     # Implementação dos ports (repositórios Prisma)
│   └── persistence/prisma/
└── presentation/       # Controllers REST e DTOs
    └── rest/
        ├── controllers/
        └── dtos/
```

- **Domain**: as entidades (`Cart`, `CartItem`, `Product`, `Coupon`) concentram todas as regras de negócio
  (validação de estoque, regras de quantidade, substituição de cupom, cálculo de subtotal/desconto/total, a regra
  de "carrinho finalizado não pode mudar") e lançam uma `AppException` tipada quando uma regra é violada. Essas
  entidades não conhecem NestJS, HTTP nem Prisma.
- **Application**: os casos de uso orquestram uma única ação (ex.: `AddItemToCartUseCase`) — carregam dados através
  de um **port** de repositório (uma interface), chamam a entidade de domínio e persistem o resultado. Casos de uso
  de um módulo podem depender de casos de uso de outro módulo (ex.: o módulo de carrinho reaproveita
  `GetProductByIdUseCase` e `FindCouponByCodeUseCase`) em vez de duplicar o tratamento de "não encontrado".
- **Infrastructure**: implementa cada port com Prisma (`ProductPrismaRepository`, `CartPrismaRepository`, ...).
  Trocar a tecnologia de persistência no futuro significa apenas escrever um novo adapter para o mesmo port.
- **Presentation**: expõe os controllers REST, os DTOs de requisição (validados com `class-validator`) e os DTOs de
  resposta (documentados com `@nestjs/swagger`), e nunca acessa o Prisma diretamente.

Preocupações transversais ficam em `src/common/`:

- `common/exceptions/` — um padrão `AppErrorDefinition` + `AppException.from(...)` com um **catálogo** de erros por
  domínio (`cart-errors.catalog.ts`, `product-errors.catalog.ts`, `coupon-errors.catalog.ts`), agregados em
  `APP_ERRORS`. Todo erro de negócio carrega um `code` estável e legível por máquina (ex.: `CART_INSUFFICIENT_STOCK`)
  e uma `message` legível por humanos. Um `HttpExceptionFilter` global transforma qualquer erro lançado
  (`AppException`, erros de validação, ou qualquer erro inesperado) em um único formato de resposta consistente.

## Regras de negócio implementadas

- **Adicionar item** (`POST /v1/carts/:id/items`): se o produto ainda não está no carrinho, ele entra com a
  quantidade informada (assume `1` quando omitida); se já está no carrinho, a quantidade informada é **somada** à
  quantidade existente. O preço do item (`unitPrice * quantity`) e o subtotal/desconto/total do carrinho são sempre
  recalculados na resposta.
- **Remover item** (`DELETE /v1/carts/:id/items/:productId`): retorna um erro tratado `404 CART_ITEM_NOT_FOUND`
  caso o produto não esteja no carrinho.
- **Alterar quantidade** (`PATCH /v1/carts/:id/items/:productId`): define a quantidade *exata* do item (não é um
  delta).
- Quantidades `<= 0` são sempre rejeitadas (`400 CART_INVALID_QUANTITY`).
- **Validação de estoque**: adicionar ao carrinho ou definir uma quantidade acima de `Product.stockQuantity`
  retorna `422 CART_INSUFFICIENT_STOCK`, com a quantidade solicitada e a disponível. O estoque **não é decrementado**
  ao adicionar itens ao carrinho ou no checkout — ver [Pendências / próximos passos](#pendências--próximos-passos).
- As respostas de produto e de item do carrinho sempre expõem o **preço líquido unitário** atual e a **quantidade
  disponível em estoque**.
- **Cupons**: `10OFF` (10%) e `15OFF` (15%) são inseridos via seed. Aplicar um cupom **substitui** qualquer cupom
  aplicado anteriormente — apenas um fica ativo por vez. Um código inexistente retorna `404 COUPON_NOT_FOUND`. O
  cupom aplicado pode ser removido.
- **Totais**: `subtotal` = soma de `unitPrice * quantity` de todos os itens; `discount` = percentual do cupom sobre
  o subtotal (`0` quando não há cupom aplicado); `total` = `subtotal - discount`. Os três valores são recalculados
  em toda leitura e após toda alteração.
- **Finalizar carrinho** (`POST /v1/carts/:id/checkout`): define o status do carrinho como `FINALIZED`. Um carrinho
  finalizado rejeita qualquer alteração posterior (`422 CART_ALREADY_FINALIZED`) — adicionar/remover itens, alterar
  quantidade e aplicar/remover cupom ficam todos bloqueados.

## API

Superfície REST completa (tudo sob `/v1`, com versionamento por URI):

| Método | Rota                          | Descrição                                              |
|--------|-------------------------------|----------------------------------------------------------|
| GET    | `/products`                   | Lista o catálogo                                          |
| GET    | `/products/:id`                | Busca um produto                                           |
| GET    | `/coupons`                     | Lista os cupons disponíveis                                 |
| POST   | `/carts`                       | Cria um carrinho novo, vazio e aberto                        |
| GET    | `/carts/:id`                   | Busca um carrinho (itens, cupom, totais)                     |
| POST   | `/carts/:id/items`             | Adiciona um produto (body: `{ productId, quantity? }`)       |
| PATCH  | `/carts/:id/items/:productId`  | Define a quantidade exata (body: `{ quantity }`)              |
| DELETE | `/carts/:id/items/:productId`  | Remove um produto do carrinho                                 |
| POST   | `/carts/:id/coupon`            | Aplica um cupom (body: `{ code }`)                             |
| DELETE | `/carts/:id/coupon`            | Remove o cupom aplicado                                        |
| POST   | `/carts/:id/checkout`          | Finaliza o carrinho                                             |

A documentação interativa do Swagger fica disponível em **`/docs`** assim que a aplicação sobe (ex.:
`http://localhost:3000/docs`). Um arquivo [`requests.http`](./requests.http) pronto para uso (funciona com a
extensão "REST Client" do VS Code) cobre todo o fluxo, incluindo os cenários de erro tratado.

Toda resposta de erro segue o mesmo formato:

```json
{
  "success": false,
  "code": "CART_INSUFFICIENT_STOCK",
  "message": "Apenas 8 unidade(s) do produto 5 estão disponíveis em estoque (solicitado: 100).",
  "timestamp": "2026-09-18T19:59:04.737Z",
  "path": "/v1/carts/.../items"
}
```

> **Nota sobre idioma:** código-fonte, identificadores, comentários e a estrutura interna do projeto estão em
> inglês; os valores de `code` são identificadores estáveis em inglês para o cliente tratar programaticamente. A
> `message` exibida ao usuário final, o catálogo de produtos e este README estão em **português**, já que o público
> da aplicação é brasileiro.

## Rodando localmente (sem Docker)

Pré-requisitos: Node.js 22+, npm, e um banco PostgreSQL (local ou [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env   # depois defina DATABASE_URL para sua instância PostgreSQL
npm run prisma:migrate:dev   # aplica as migrations
npm run prisma:seed          # insere os 10 produtos e os 2 cupons
npm run start:dev
```

A API sobe em `http://localhost:3000` (variável `PORT` no `.env`), com a documentação em `/docs`.

## Rodando com Docker

```bash
docker compose up --build
```

Isso sobe um container PostgreSQL local e o container da API. Ao iniciar, o container da API executa
`prisma migrate deploy`, popula o catálogo (seed) e então inicia o servidor em `http://localhost:3000`. Para
apontar o Docker Compose para o Neon em vez do Postgres local, defina `DATABASE_URL` no serviço `api` do
`docker-compose.yml` com a connection string do Neon e remova a dependência do serviço `postgres`.

## Variáveis de ambiente

| Variável        | Descrição                                                  | Padrão                   |
|------------------|---------------------------------------------------------------|----------------------------|
| `NODE_ENV`       | `development` \| `production` \| `test`                       | `development`              |
| `PORT`           | Porta HTTP                                                     | `3000`                     |
| `DATABASE_URL`   | Connection string do PostgreSQL (Prisma)                        | — (obrigatória)              |
| `FRONTEND_URL`   | Origem permitida no CORS para o frontend                          | `http://localhost:3001`    |

## Testes

```bash
npm test          # testes unitários (regras de domínio, casos de uso)
npm run test:cov  # testes unitários com cobertura
npm run test:e2e  # testes end-to-end contra a aplicação e o banco reais
```

`test:e2e` precisa de um `DATABASE_URL` acessível, migrado e populado (mesmo requisito para rodar a aplicação
localmente). Os testes unitários não têm dependências externas e são os que rodam no CI.

## Decisões de design e premissas assumidas

- **Padrão de nomenclatura do banco**: as tabelas recebem o prefixo `tb_` e toda chave primária/estrangeira recebe
  o prefixo `idtb_` (ex.: `tb_products.idtb_products`, `tb_cart_items.idtb_carts`), conforme solicitado. É uma
  escolha puramente de nomenclatura física do banco, aplicada via `@map`/`@@map` do Prisma — o código TypeScript
  (models, campos, variáveis) continua em inglês/camelCase idiomático.
- **Dados de catálogo e cupons**: os arquivos `produtos.json` / `cupons.json` do enunciado original não estavam
  disponíveis, então [`prisma/data/products.json`](./prisma/data/products.json) e
  [`prisma/data/coupons.json`](./prisma/data/coupons.json) foram criados seguindo exatamente os campos descritos no
  enunciado (id, descrição, estoque, preço líquido / id, código, percentual de desconto) e são aplicados via
  `prisma db seed`, atendendo ao requisito de persistir via seed/migration. As descrições dos produtos estão em
  português (os `code`s dos cupons permanecem exatamente `10OFF`/`15OFF`, conforme exigido).
- **"Adicionar item" sem quantidade explícita**: o enunciado é ambíguo sobre se um item novo sempre entra com
  quantidade `1` ou entra com a quantidade informada. Esta implementação trata `1` como valor **padrão** quando
  `quantity` é omitido na requisição, e usa a quantidade informada nos demais casos — tanto itens novos quanto
  existentes respeitam a quantidade enviada, generalizando o exemplo do enunciado em vez de contradizê-lo.
- **Preço do item sempre "ao vivo"**: `CartItem` não persiste um preço "congelado" — o preço unitário e o estoque
  disponível exibidos para um item sempre refletem os valores *atuais* do catálogo, relidos a cada requisição. Isso
  evita que o carrinho fique dessincronizado do catálogo caso o preço ou o estoque de um produto mude depois de
  adicionado ao carrinho.
- **Totais calculados, não armazenados**: `subtotal`, `discount` e `total` são derivados a cada leitura a partir dos
  itens + cupom, em vez de colunas persistidas — assim nunca podem ficar desatualizados em relação ao conteúdo real
  do carrinho.
- **Sem autenticação / sem dono do carrinho**: o enunciado não pede isso, e um carrinho é endereçado apenas pelo seu
  próprio `id` (um UUID), como um carrinho anônimo/de visitante típico.
- **Filtro global de exceções**: todo erro lançado — `AppException`, erros de validação do NestJS, ou qualquer erro
  inesperado — é normalizado no mesmo formato `{ success, code, message, timestamp, path }`, para que o frontend
  nunca precise tratar formatos de erro diferentes.

## Pendências / próximos passos

Dado o prazo de 2 dias, os itens abaixo foram deixados de fora intencionalmente — registrados aqui em vez de
deixados sem explicação:

- **O estoque não é decrementado** ao adicionar itens ao carrinho ou no checkout, nem é restaurado se um carrinho é
  abandonado. O enunciado só pede que adicionar/alterar seja *bloqueado* acima do estoque disponível, não que o
  estoque seja reservado/comprometido — implementar reserva de estoque de verdade exigiria decidir sobre
  expiração/abandono de carrinho e concorrência (ex.: lock otimista), o que ficou fora do escopo aqui.
- **Sem paginação** em `GET /products` — o catálogo é fixo em 10 itens, então não foi necessário, mas é o primeiro
  ponto a evoluir se o catálogo crescer.
- **Regras de cupom mínimas** (percentual fixo sobre o subtotal, um único cupom ativo), já que só `10OFF`/`15OFF`
  eram exigidos; não há janela de validade, valor mínimo de subtotal ou limite de uso por cupom.
- **O CI não roda `test:e2e`**, pois esse teste precisa de um banco real, migrado e populado, e não há esse segredo
  configurado no GitHub Actions para este exercício. `npm test` (unitários) roda em todo push/PR.
