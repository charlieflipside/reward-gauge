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

Automatically calling an Ethereum smart contract on a schedule with conditional constraints & attempts at gas savings.


