/// first step is to create a .env with the variables in example-vars

// second step is to run
docker compose -f compose.local.yaml up --build

.. this command builds and runs teh containers
please navigate to local host 3000 at this point you can run

docker compose -f compose.local.yaml up --build
by defaiult api runs on port 8080 and the front end on 3000
