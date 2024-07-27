# BUILDER
FROM node:lts-alpine3.20 AS builder

WORKDIR /build/

# Deps
RUN apk add --update python3 py3-pip alpine-sdk linux-headers pjproject-dev

# Node deps
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY package.json ./
RUN yarn install --frozen-lockfile

# Shared code
COPY ./shared/ ./shared/

# Build client
COPY ./client/ ./client/
RUN cd client && yarn build

# Build pjcall
COPY ./pjcall ./pjcall
RUN cd pjcall && make

# Build server
COPY ./server/ ./server/
RUN cd server && yarn build


# PROD ENV
FROM node:lts-alpine3.20

# Runtime deps
RUN apk add --update libc6-compat libuuid pjproject-dev

WORKDIR /app/

COPY package.json yarn.lock ./

# Server deps
COPY server/package.json yarn.lock ./server/
RUN apk add --virtual .build-deps python3 py3-pip alpine-sdk \
  && cd server \
  && yarn install --prod --frozen-lockfile \
  && apk del .build-deps

# Shared files
COPY --from=builder /build/build/shared/ ./build/shared/

# Static client files
COPY --from=builder /build/build/client/ ./build/client/

# Pjcall binary
COPY --from=builder /build/pjcall/pjcall ./pjcall/

# Server files
COPY --from=builder /build/build/server/ ./build/server/

# Start the server
EXPOSE 5000
CMD [ "yarn", "start" ]
