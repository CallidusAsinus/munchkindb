#!/bin/bash

echo "Creating DB"
docker exec mdb-server php app/console doctrine:database:create
docker exec mdb-server php app/console doctrine:schema:update --force

echo "Importing cards data"
docker exec mdb-server git clone https://github.com/CallidusAsinus/munchkin-cards-json.git ./cards-json
echo "--- Using workaround for issue #10 --- Please remove it as soon as issue is resolved ---"
docker exec mdb-server sed -i -- 's/"OA1"/null/g' ./cards-json/pack/s1c.json
docker exec mdb-server php app/console nrdb:import:std ./cards-json
