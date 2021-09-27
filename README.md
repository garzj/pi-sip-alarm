# pi-sip-alarm

Raspberry PI Service configurable to call and alarm people, when certain pins on the PI are activated.

## Run with docker-compose

- Install [Docker](https://github.com/docker/docker-install) and (docker-compose)[https://docs.docker.com/compose/install/]
- Get the [docker-compose.yml](./docker-compose.yml) file from this repo
- `docker-compose up -d`

## Run manually

### Prerequisites

- CMake or `apt-get install build-essentials`
- [Pjsua](https://www.pjsip.org/)
- [NodeJS + npm](https://nodejs.org/en/)

### Build the app

`npm run build`

### Start the app

`npm start`
