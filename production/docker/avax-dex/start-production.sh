#!/bin/bash

# BEGIN: Optional configuration settings

# The human readable name this IPFS node identifies as.
export COORD_NAME=avax-dex-generic

# Allow this node to function as a circuit relay. It must not be behind a firewall.
#export ENABLE_CIRCUIT_RELAY=true
# For browsers to use your circuit realy, you must set up a domain, SSL certificate,
# and you must forward that subdomain to the IPFS_WS_PORT.
#export CR_DOMAIN=subdomain.yourdomain.com

# Debug level. 0 = minimal info. 2 = max info.
export DEBUG_LEVEL=2

# END: Optional configuration settings


# Production database connection string.
export DBURL=mongodb://172.17.0.1:5666/swap-service-prod

# Configure REST API port
export PORT=5110

# avax-dex specific env vars
export AVAX_DEX_ENV=production
export WEBHOOKSERVICE=5667

npm start
