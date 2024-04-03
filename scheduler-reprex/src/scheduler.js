

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
