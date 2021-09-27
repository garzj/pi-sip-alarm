# BUILDER
FROM node:lts-alpine3.14 AS builder

WORKDIR /build/

# Deps
RUN apk add --update python3 py3-pip alpine-sdk linux-headers pjproject-dev

# Node deps
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY package*.json ./
RUN npm ci

# Shared code
COPY ./shared/ ./shared/

# Build client
COPY ./client/ ./client/
RUN cd client && npm run build

# Build pjcall
COPY ./pjcall ./pjcall
RUN cd pjcall && make

# Build server
COPY ./server/ ./server/
RUN cd server && npm run build


# PROD ENV
FROM node:lts-alpine3.14

# Runtime deps
RUN apk add --update libc6-compat libuuid pjproject-dev

WORKDIR /app/

# Server deps
COPY ./server/package*.json ./server/
RUN apk add --virtual .build-deps python3 py3-pip alpine-sdk \
  && cd server \
  && npm ci --prod \
  && apk del .build-deps

# Shared deps
COPY package*.json ./
RUN npm ci --only=prod

# Static client files
COPY --from=builder /build/client/build/ ./client/build/

# Pjcall binary
COPY --from=builder /build/pjcall/pjcall ./pjcall/

# Server files
COPY --from=builder /build/server/build/ ./server/build/

# Start the server
EXPOSE 5000
CMD [ "npm", "start" ]
