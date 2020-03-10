node ./service1/main.js &
sleep 1
node ./service2/main.js &
sleep 1
node ./server/main.js
sleep 1
yarn kill-port 19000
yarn kill-port 19001
exit
