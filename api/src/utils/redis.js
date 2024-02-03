import { createClient } from "redis";

const redisClient = createClient({
    password: "J61yjkUvqWg9Y7zrRrWLosqTQ8M7xXfW",
    socket: {
        host: "redis-19914.c301.ap-south-1-1.ec2.cloud.redislabs.com",
        port: 19914,
    },
});

export default redisClient;
