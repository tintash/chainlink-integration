#!/bin/bash
set -e
#---------------------------------
# Install following dependencies
# --------------------------------
# brew install coreutils
#---------------------------------
alias timeout=gtimeout

export STACKS_BLOCKCHAIN_API_DIR_PATH="../../stacks-blockchain-api"
export CHAINLINK_DIR_PATH="../../chainlink"

declare red=$(tput setaf 1)
declare green=$(tput setaf 2)
declare reset=$(tput sgr0)

wait-for-endpoint() {
    echo "Waiting for $2: ${green}$1${reset}"
    timeout -s TERM 60 bash -c \
        'while [[ "$(curl -s -o /dev/null -L -w ''%{http_code}'' ${0})" != "200" ]];\
    do sleep 2;\
    done' ${1}
}

# end_to_end_testing() {
#     echo -e "\n${green}Test $1${reset}" && sleep 1
#     curl --location --request GET "http://localhost:3000/consumer-test?id=$1"
#     echo "" && sleep 15 # Waiting for fulfilled response to come back from chainlink 
#     stx -t call_read_only_contract_func ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM direct-request read-data-value ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM -I http://localhost:20443
# }

if [[ -z "${STACKS_BLOCKCHAIN_API_DIR_PATH}" ]]; then
    echo "${red}Error:${reset} Set STACKS_BLOCKCHAIN_API_DIR_PATH env var for integration testing"
elif [[ -z "${CHAINLINK_DIR_PATH}" ]]; then
    echo "${red}Error:${reset} Set CHAINLINK_DIR_PATH env var for integration testing"
else
    # export STACKS_BLOCKCHAIN_API_DOCKER_BUILD_CONTEXT=$STACKS_BLOCKCHAIN_API_DIR_PATH

    # echo "${green}Building services${reset}"
    # docker-compose -f ../../configurations/docker-compose.stacks-blockchain-api.yml -f ../../configurations/docker-compose.chainlink.yml -f ../../configurations/docker-compose.event-observer.yml build -d

    # echo "${green}Starting services${reset}"
    # docker-compose -f ../../configurations/docker-compose.stacks-blockchain-api.yml -f ../../configurations/docker-compose.chainlink.yml -f ../../configurations/docker-compose.event-observer.yml up -d

    wait-for-endpoint localhost:3999 "stacks-blockchain-api"

    # cd ../../contracts/clarity && clarinet publish --devnet
    # echo "${green}Successfully deployed contracts to devnet${reset}" && sleep 15 # Sleep to wting for contracts to be deployed

    # echo "${green}Starting end to end tests${reset}"
    # end_to_end_testing 0
    # end_to_end_testing 1
    # end_to_end_testing 2
    # end_to_end_testing 3
    

    # echo "${green}Stoping services${reset}"
    # docker-compose -f ../../configurations/docker-compose.stacks-blockchain-api.yml -f ../../configurations/docker-compose.chainlink.yml -f ../../configurations/docker-compose.event-observer.yml down -v 
fi
