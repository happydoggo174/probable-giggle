FROM oven/bun:slim@sha256:7e8ed3961db1cdedf17d516dda87948cfedbd294f53bf16462e5b57ed3fff0f1
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
USER bun
EXPOSE 3000
WORKDIR src/
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]