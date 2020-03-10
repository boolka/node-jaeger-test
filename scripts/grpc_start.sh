node ./service1/grpc_main.js &
sleep 1
node ./service2/grpc_main.js &
sleep 1
node ./server/grpc_main.js
sleep 1
yarn kill-port 20000
yarn kill-port 20001
exit
