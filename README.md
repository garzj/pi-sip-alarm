# pi-sip-alarm

Raspberry PI Service configurable to call and alarm people, when certain pins on the PI are activated.

## Run inside Docker

- Install [Docker](https://www.docker.com/)  
  `curl -s -L https://get.docker.com | sudo sh`
- Start the app  
  `sudo docker run --rm -it -v "$pwd/data:/app/server/data" -p 8080:5000 --privileged --name pi-sip-alarm garzj/pi-sip-alarm`
- Stop the app:  
  `sudo docker stop pi-sip-alarm`

## Run with docker-compose

- Install [docker-compose](https://docs.docker.com/compose/install/): `sudo apt install -y docker-compose`
- Get the [docker-compose.yml](./docker-compose.yml) file from this repo
- Pull the image: `sudo docker-compose pull`
- Start the app: `sudo docker-compose up -d`
- Stop the app: `sudo docker-compose down`

## Build manually

- Install CMake  
  `sudo apt install -y build-essentials`
- Install [Pjsua](https://www.pjsip.org/)
- Install [NodeJS](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/lang/en/docs/install/)
- Build the app: `yarn build`
- Start the app: `yarn start`
