# pi-sip-alarm

Raspberry PI Service configurable to call and alarm people, when certain pins on the PI are activated.

## Run inside Docker

- Install [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

  ```
  curl -s -L https://get.docker.com | sudo sh
  sudo apt-get install docker-compose
  ```

- Get the [docker-compose.yml](./docker-compose.yml) file from this repo
- Start the app: `docker-compose pull && docker-compose up -d`
- Stop it: `docker-compose down`

## Build manually

- Install CMake  
  `apt-get install build-essentials`
- Install [Pjsua](https://www.pjsip.org/)
- Install [NodeJS + npm](https://nodejs.org/en/)
- Build the app: `npm run build`
- Start the app: `npm start`
