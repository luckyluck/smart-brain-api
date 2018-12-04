# SmartBrain-api - v2
Final project for Udemy course

1. Clone this repo
2. Run `npm install`
3. Run `npm start`
4. You must add your own API key in the `controllers/image.js` file to connect to Clarifai API.
5.1. Run `docker build` to build container via Docker
5.2. Run `docker-compose build` to build container via Docker Composer
6. Run `docker-compose run --service-ports smart-brain-api` to launch container
7. Run `docker-compose down` to stop all running containers
7. Run `docker-compose up -d` to launch container in the background
8. Run `docker-compose exec smart-brain-api bash` to get access to the bash of the container running in the background

You can grab Clarifai API key [here](https://www.clarifai.com/)

** Make sure you use postgreSQL instead of mySQL for this code base.
