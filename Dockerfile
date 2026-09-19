# Single-stage image: this is a technical-test deliverable, not a production
# deploy, so we keep devDependencies around at runtime — they're needed to
# run `prisma migrate deploy` / `prisma db seed` (ts-node) from the container.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# The postinstall script below runs `prisma generate`, which needs the schema
# present — copy it in before `npm ci`, ahead of the rest of the source.
COPY prisma ./prisma
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
