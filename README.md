# Automating Contract Calls w/ Cloudflare Workers

Simple CRON trigger based automations, including `ethers.js` and environments 
for handling private keys. Useful for community/donation based automations on Ethereum.

# Initialize

You'll need a Cloudflare account (free trial is fine for this).
```bash
npm create cloudflare@latest
npm install -g @cloudflare/wrangler
wrangler login

```

1. Name the directory
2. Select a type (I used Scheduled Worker / Cron Trigger)
3. Choose whether you are using typescript

# TOML

We will use the following features:

- Key Value (KV) Namespace 
- Environments (Secrets)
- CRON Trigger

## Create KV Store

Run with your namespace, and copy/insert the result into your `wrangler.toml`.
```bash
wrangler kv:namespace create "MY_KV_NAMESPACE"
```

```js
kv_namespaces = [
  { binding = "rewardGauge", id = "6a04097b387546ce9c85abd9d3b21634" }
]
```

# Basic Scheduler Reprex

A basic reproducible example for a scheduled worker that updates a KV store `scheduler-reprex/`

## Testing CRON scheduler

For testing, every 1 minute we will `put` a lastRun into the store and have the worker fetch it.
The website for this worker will automatically show the lastRun date.

`scheduler-reprex/src/scheduler.js` 

```js

export default {
    async fetch(event, env, ctx) {
        let lastRun = await env.rewardGauge.get("lastDate");
        if (lastRun === null) {
            await env.rewardGauge.put("lastDate", new Date().toISOString());
            lastRun = "This is the first run";
        }
        return new Response('Last run time: ' + lastRun);
    },

    async scheduled(event, env, ctx) {
        let now = new Date().toISOString(); 
		console.log("a minute has passed: " + now);
        await env.rewardGauge.put("lastDate", now);
    },
};

```

```yaml
name = "scheduler-reprex"
main = "src/scheduler.js"
compatibility_date = "2024-03-29"

kv_namespaces = [
  { binding = "rewardGauge", id = "6a04097b387546ce9c85abd9d3b21634" }
]

[triggers]
crons = ["* * * * *"] # * * * * * = run every minute

```


The development server may not adequately run CRON triggers, but is available for testing, just turn off the local mode for best results.
```bash
npx wrangler dev
```

Deploy the app to a free worker subsite and refresh periodically to see the latest run. 

https://scheduler-reprex.truefreeze.workers.dev/

```bash
wrangler deploy --config scheduler-reprex\wrangler.toml
```

# Gauge Automation

## Using Environments for Private Keys

Environments are a protected way to store and access private data, including 
API keys or private keys. Certain calculations can be done on environment variables (e.g., signing transactions or calculating a public key, see: `genPublicKey()`) but they cannot be read directly. They are accessed via `env`.

These environment secrets are stored on Cloudflare, and cannot be accessed locally.

```bash
wrangler secret put gaugePrivateKey
>> 0x.........
```

here, the `gaugePrivateKey` (must have leading `0x`) is accessed via `env` to print the public key `0x51372....1594`.

You can run `npx wrangler dev` to test this fetch, but you must turn `OFF` local mode to make the environment accessible.

```js
import {ethers} from 'ethers';

let genPublicKey = function(privateKey){
    
    const wallet = new ethers.Wallet(privateKey);
    // Derive the public key
    const publicKey = wallet.address;
    return(publicKey);
}

export default {
    async fetch(event, env, ctx) {
        let lastRun = await env.rewardGauge.get("lastDate");
        let pubKey = await genPublicKey(env.gaugePrivateKey);
        if (lastRun === null) {
            await env.rewardGauge.put("lastDate", new Date().toISOString());
            lastRun = "This is the first run";
        }
        return new Response('Last run time: ' + lastRun + '\n public key: ' + pubKey);
    },
```

```
Last run time: 2024-04-18T16:37:09.217Z
 public key: 0x513725A6aDDb614a216AeD725294b44835181594
```

## Example of a Real Tx 

Using Polygon as that blockchain is significantly cheaper, the `wrapMatic.js` script details 
- connect a private key (here, gitignored `ignore.json`)
- connect a public RPC provider 
- calling a contract (here, Wrapped MATIC to `deposit` MATIC)
    - with custom priority fee, base fee, nonce and chainID (polygon is chainId 137)
- Logging the tx_hash (which allows us to check a 3rd party like Polygonscan for the pending tx before it lands or fails)

## Getting a Gas Price



## Checks Before Submitting a Real Tx

- Storing last attempt tx_hash
    Store attempt & nonce 
- Checking that last tx_hash
    - resubmitting failed transaction
    - waiting for pending transaction
    - updating with a new tx_hash (when allowed to!)

Automatically calling an Ethereum smart contract on a schedule with conditional constraints & attempts at gas savings. Includes

- private key mgmt via environments
- gas price modeling (try to save money)
- Tracking & storage of past and pending scheduled transactions.


