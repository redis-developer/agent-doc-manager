![redis](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252F058ee4ca590741319098059102b63954%252F4561fac3ee9549429fdb110679d6af17%3Fquality%3D60%26width%3D200%26height%3D200&w=256&q=75)

## Products

Fully managed and integrated with Google Cloud, Azure, and AWS.

Build the fastest, most reliable GenAI apps with our advanced vector database.

Self-managed software with enterprise-grade compliance and reliability.

Synchronize data in near-real time to make data fast—without writing code.

In-memory database for caching & streaming.

## Tools

## Get Redis

## Connect

## Learn

## Latest

## See how it works

### Learn

# Creating a Real-time Leaderboard with UE5 and Redis

## Overview[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#overview)

### Where Redis fit into game development[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#where-redis-fit-into-game-development)

Redis's performance, low latency, and versatility make it an excellent choice for building responsive and scalable game backends, especially for real-time multiplayer games. There are several use cases where Redis can improve your game development pipeline, the most common and impactful are real-time leaderboards and matchmaking. Other use cases include: session management, game state data caching, inventory, analytics, rate limiting.

#### **Empowering Real-Time Game Development with the Speed of Redis and the Power of Unreal**

Unreal Engine is a cornerstone of the video game industry, trusted by AAA studios and indie developers alike for its unmatched graphical fidelity, flexible architecture, and powerful Blueprints system. As a real-time 3D creation platform, Unreal enables developers to build immersive, interactive experiences across platforms—from PC and consoles to mobile and XR.

Redis, the world’s most popular in-memory data store, brings extreme speed, simplicity, and scalability to real-time applications. With sub-millisecond response times, built-in data structures (such as lists, sets, sorted sets, hashes, and streams), and support for pub/sub messaging, Redis is a perfect match for the demanding performance needs of multiplayer games, live leaderboards, matchmaking, state synchronization, and analytics.

### Tutorial[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#tutorial)

###### NOTE

There is also a video version of this tutorial on the [Redis YouTube](https://www.youtube.com/c/redisinc) channel.

### Introduction[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#introduction)

Welcome to this tutorial on creating a real-time leaderboard with Redis and Unreal Engine 5. To get you started, we have an example project named Redis Racer that you can download from [GitHub](https://github.com/redis-developer/redis-racer). There is also a written version of this tutorial for your reference. The links to which will be in the description below.  The prerequisites this tutorial are:

For our leaderboard, we will be using a sorted set as the data type. A sorted set is a collection of unique strings (members) ordered by an associated score, which is perfect for showing the names and current scores of the top scoring players.

### Build your leaderboard API[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#build-your-leaderboard-api)

#### **Code Review**

`game-backend`
`addLeaderboardEntry`
`getLeaderboard`
`export async function addLeaderboardEntry(key, score, member) {
const redis = await getClient();
const date = new Date();

//ZADD key score member, where member is a string that includes the member name and the date
const result = await redis.zAdd(key,[{ value: member.toUpperCase() + "-" + date.toISOString(), score: score }]);

if (result > 0) {
return { status: 200, message: "ZADD success, added new leaderboard entry."};
} else {
return { status: 400, message: "ZADD failed..." };
}
}`

In this function, we use the Redis client to send the ZADD command to add a new member to a sorted set. If there is currently no sorted set with this key, the ZADD command will also create a new sorted set. The member variable is the initials of the player appended to the current timestamp to allow for multiple entries of the same initials to be added to the leaderboard. If the result of the ZADD command is an integer greater than 0, the command was successful, otherwise the command failed.

`export async function getLeaderboard(key, count) {
const redis = await getClient();

//ZRANGE key start stop [WITHSCORES] [REV]
const result = await redis.zRangeWithScores(key, 0, count-1, { REV: 'true' });

if (result.length === 0) {
return { status: 404, message: "No leaderboard entries found." };
}

const leaderboard = {
"leaderboard": result
};

return leaderboard;
}`

In this function the Redis client is used to send a ZRANGE command with the WITHSCORES and REVERSE options. The count variable is the total number of entries we want to retrieve from the leaderboard. Since the result is a zero-based array, we will pass in 0 for the start parameter and count -1 for the stop parameter. If the result is an empty array, no leaderboard entries were found.

#### **Testing the RestAPI**

`cp .env.example .env
docker compose up -d`

2. Test the RestAPI with curl or Postman:

`curl -X GET "http://localhost:3000/api/leaderboard/<key-name>?count=<number_of_entries>"

// example
curl -X GET "http://localhost:3000/api/leaderboard/redis-racer?count=10"`
`curl -X POST http://localhost:3000/api/leaderboard -H "Content-Type: application/json" -d "{\"key\": <key_name>, \"score\": <score>, \"member\": <player_initials>}"

// example
curl -X POST http://localhost:3000/api/leaderboard -H "Content-Type: application/json" -d "{\"key\": \"redis-racer\", \"score\": 1564, \"member\": \"rrt\"}"`

## Setup Redis Racer in UE5[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#setup-redis-racer-in-ue5)

#### **Add VaRest plugin**

#### **Create the BP_Leaderboard blueprint**

![EventBeginPlay](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F5e04c9f5a60f439ea00a2b7b03bf18c9&w=1080&q=75)![AddLeaderboardEntry](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fa44f6e867db24512a9d738f7751d7269&w=1080&q=75)![GetLeaderboard](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fdfd4425626984791bdb6dfb21f52589e&w=1080&q=75)![GetLeaderboardComplete](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F324d61a4f00f4575bec1defbc348f33a&w=1080&q=75)![CreateRaceEndWidget](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F3789fb9ae28d4dbca86033e778979919&w=1080&q=75)

## Connecting to Redis Cloud[#](/learn/howtos/create-a-leaderboard-with-redis-and-ue5#connecting-to-redis-cloud)

#### **Creating a new Redis database**

#### **Updating environment variables**

Now we need to update our game backend code to use the Redis Cloud database. Here, we have two choices: continue using Docker to run our game backend container or run the game backend server with NodeJS. Both methods require updating the Redis URL to point to the Redis Cloud database. The difference is which environment variable file to update.

##### To continue using Docker

`REDIS_URL="redis://default:<password>@<public_endpoint>"`

8. Save and run the docker containers

`docker compose down
docker compose up -d`

9. In Docker Desktop

10. Stop the local Redis container but leave the game backend leaderboard running.

##### If you would rather use NodeJS

`cp .env.example .env
npm install
npm run dev`

#### **Testing the Redis Cloud database**

#### **View the Redis Cloud database using Redis Insight**

We can use Redis Insight to get a graphical user interface of our Redis databases. Previously, you had to install the desktop application and connect it to your cloud database but now we have Redis Insight in the cloud! That means you can look at your Redis Cloud database in your web browser without having to install the desktop application.

There we have it, we can see our leaderboard entries! Our game backend is now connected to Redis Cloud and we have a real-time leaderboard with Redis and Unreal Engine 5! If you liked this tutorial, take a look at the video version on [YouTube](https://www.youtube.com/c/redisinc)!

![](https://cdn.builder.io/api/v1/pixel?apiKey=bf70e6aa643f4e8db14c5b0c8dbba962)

#### On this page

![redis](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F5967535bd7634e21ba628d5fc68a4f49&w=256&q=75)
![Facebook](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F7cf106bf58b54191a50914ff30abdfd2&w=48&q=75)
![Youtube](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F0105eb5231844a42b405f798caaff489&w=48&q=75)
![Linkedin](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F63263fcd5d05491b943d9e0f2861a11f&w=48&q=75)
![Instagram](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Faf82c736e3c2462fad239221f8d9ffdc&w=48&q=75)
![Twitter](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F0e64be4c44124e28ba0ec78aa2e5fae5&w=48&q=75)
![Github](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F5d02327ac8e947eb9002e6edb02a16a9&w=48&q=75)

### Use Cases

### Industries

### Compare

### Company

### Connect

### Partners

### Support
