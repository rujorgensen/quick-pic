# ******************************************************************************
# *** BASE STAGE
# ******************************************************************************
# use the official Bun image, see all versions at https://hub.docker.com/r/oven/bun/tags
# install dependencies into temp directory, this will cache them and speed up future builds
FROM oven/bun:1.2.15-alpine AS base

WORKDIR /src

# ******************************************************************************
# *** INSTALL STAGE
# ******************************************************************************
# use the official Bun image, see all versions at https://hub.docker.com/r/oven/bun/tags
# install dependencies into temp directory, this will cache them and speed up future builds
FROM base AS install

COPY package.json bun.lockb ./

RUN  bun install --frozen-lockfile

# ******************************************************************************
# *** BUILD STAGE
# ******************************************************************************
# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS build

COPY --from=install ./src/node_modules node_modules
COPY package.json ./
COPY ./src ./src

# ENV NODE_ENV=production
RUN bun run build

# ******************************************************************************
# *** DEPLOY STAGE
# ******************************************************************************
# copy production dependencies and source code into final image
FROM base AS deploy

COPY --from=install ./src/node_modules node_modules
COPY --from=build ./src/dist ./dist

# run the app
USER bun
EXPOSE 3000/tcp

ENTRYPOINT [ "bun", "run", "./dist/index.js" ]
