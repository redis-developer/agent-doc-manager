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

# How to build a HackerNews Clone using Redis

![Ajeet Raina](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F241cb4ece2bb4c0fb6df75c4495182cd)

Hacker News (sometimes abbreviated as HN) is a social news website focusing on computer science and entrepreneurship. It developed as a project of Graham's company Y Combinator, functioning as a real-world application of the Arc . programming language which Graham co-developed.

This is a HackerNews clone built upon React, NextJS as a frontend and NodeJS, ExpressJS & Redis as a backend. This application uses JSON for storing the data and Search in Redis Stack for searching.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F7c5563e31f6b4ad1893de43a5eb98ebf&w=1920&q=75)

## Step 1. Install the prerequisites[#](/learn/howtos/hackernews#step-1-install-the-prerequisites)

**Install the below packages**

## Step 2. Create Redis Cloud database[#](/learn/howtos/hackernews#step-2-create-redis-cloud-database)

Redis is an open source, in-memory, key-value data store most commonly used as a primary database, cache, message broker, and queue. Redis is popular among the developers as it delivers sub-millisecond response times, enabling fast and powerful real-time applications in industries such as gaming, fintech, ad-tech, social media, healthcare, and IoT.

Redis Cloud is a fully-managed cloud service for hosting and running your Redis dataset in a highly-available and scalable manner, with predictable and stable top performance. Redis Cloud allows you to run Redis server over the Cloud and access instance via multiple ways like RedisInsight, Redis command line as well as client tools. You can quickly and easily get your apps up and running with Redis Cloud through its Redis Heroku addons , just tell us how much memory you need and get started instantly with your first Redis database. You can then add more Redis databases (each running in a dedicated process, in a non-blocking manner) and increase or decrease the memory size of your plan without affecting your existing data.

[Follow this link](https://redis.com/try-free) to create a Redis Cloud account with 2 databases with Redis Stack.

Save the database endpoint URL and password for our future reference

## Step 3. Clone the repository[#](/learn/howtos/hackernews#step-3-clone-the-repository)

`git clone https://github.com/redis-developer/redis-hacker-news-demo
 cd redis-hacker-news-demo`

## Step 4. Setting up environment variables[#](/learn/howtos/hackernews#step-4-setting-up-environment-variables)

Copy .env.sample to .env and provide the values as shown below:

`MAILGUN_API_KEY=YOUR_VALUE_HERE
 SEARCH_REDIS_SERVER_URL=redis://redis-XXXXX.c10.us-east-1-2.ec2.cloud.redislabs.com:10292
 SEARCH_REDIS_PASSWORD=ABCDXYZbPXHWsC
 JSON_REDIS_SERVER_URL=redis://redis-XXXXX.c14.us-east-1-2.ec2.cloud.redislabs.com:14054
 JSON_REDIS_PASSWORD=ABCDXYZA3tzw2XYMPi2P8UPm19D
 LOG_LEVEL=1
 USE_REDIS=1
 REDIS_REINDEX=
 PRODUCTION_WEBSITE_URL=i`

## Step 5. Run the developer environment[#](/learn/howtos/hackernews#step-5-run-the-developer-environment)

`npm install
 npm run dev`

## Step 6. Pull Hacker News API to seed database[#](/learn/howtos/hackernews#step-6-pull-hacker-news-api-to-seed-database)

Using [API](https://github.com/HackerNews/API), it pulls the latest hackernews data. Next, you need to seed top stories from hacker news. First create a moderator with moderator:password123

`node ./backend/scripts/seed.js`

## Step 7. Access the HackerNews URL[#](/learn/howtos/hackernews#step-7-access-the-hackernews-url)

Open https://localhost:3001 and you should be able to access the HackerNews login screen as shown below:

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fa7ab274077574c2f99c648936a0c55dd&w=1920&q=75)

## How it works[#](/learn/howtos/hackernews#how-it-works)

### By Screens[#](/learn/howtos/hackernews#by-screens)

#### Signup[#](/learn/howtos/hackernews#signup)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fa7ab274077574c2f99c648936a0c55dd&w=1920&q=75)
`FT.SEARCH idx:user @username:"andy1" NOCONTENT LIMIT 0 1 SORTBY _id DESC`
`GET user:id-indicator // 63
 INCR user:id-indicator // 64 will be next user id, 63 is current user id`
`HSET user:63 username andy1 email created 1615569194 karma 0 about showDead false isModerator false shadowBanned false banned false _id 63`
`JSON.SET user:63 .`
`'{"username":"andy1","password":"$2a$10$zy8tsCske8MfmDX5CcWMce5S1U7PJbPI7CfaqQ7Bo1PORDeqJxqhe","authToken":"AAV07FIwTiEkNrPj0x1yj6BPJQSGIPzV0sICw2u0"," authTokenExpiration":1647105194,"email":"","created":1615569194,"karma":0,"showDead":false,"isModerator":false,"shadowBanned":false,"banned":false,"_id":63}'`

#### Login[#](/learn/howtos/hackernews#login)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F9f709ab989ff42168eec8b19ffd74a8f&w=1920&q=75)
`FT.SEARCH idx:user @username:"andy1" NOCONTENT LIMIT 0 1 SORTBY _id DESC`
`JSON.MGET user:63 .`

#### Item list page[#](/learn/howtos/hackernews#item-list-page)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F77027b87530d4c8ebdae76f123323b3b&w=1920&q=75)
`FT.SEARCH idx:user-hidden @username:"andy1" NOCONTENT LIMIT 0 10000 SORTBY _id DESC
 // Result - [0, "item:4"]`
`FT.SEARCH idx:item (-(@id:"item:4")) (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY _id ASC`
`FT.SEARCH idx:item (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY _id ASC
 // Result - [3,"item:1","item:2","item:3"]`
`JSON.MGET`
`JSON.MGET item:1 item:2 item:3 .
 // Result - [{"id":"bkWCjcyJu5WT","by":"todsacerdoti","title":"Total Cookie
 Protection","type":"news","url":"https://blog.mozilla.org/security/2021/02/23/total-cookie-
 protection/","domain":"mozilla.org","points":1,"score":1514,"commentCount":0,"created":1614089461,"dead":false,"_id":3}]]`
`FT.SEARCH idx:item (@created:[(1615652598 +inf]) (@dead:"false") NOCONTENT LIMIT 0 0 SORTBY _id DESC
 // Result - [13,"item:19","item:17","item:16","item:15","item:14","item:13","item:12","item:11","item:8","item:5","item:4","item:3","item:1"]`

###### NOTE

In this case, 1615652598 is a timestamp of 1 week ealier than current timestamp

`JSON.MGET item:19 item:17 item:16 item:15 item:14 item:13 item:12 item:11 item:8 item:5 item:4 item:3 item:1 .
 // Result - the JSON of selected items`

#### Item Detail[#](/learn/howtos/hackernews#item-detail)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F0d167ae2a20d45f89d7a4823682f2e82&w=1920&q=75)
`JSON.MGET item:1 .`
`FT.SEARCH idx:comment (@parentItemId:"kDiN0RhTivmJ") (@isParent:"true") (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY points ASC
 // Result - [3,"comment:1","comment:2","comment:12"]`
`JSON.MGET comment:1 comment:2 comment:12 .
 // one comment example result - {"id":"jnGWS8TTOecC","by":"ploxiln","parentItemId":"kDiN0RhTivmJ","parentItemTitle":"The Framework
 Laptop","isParent":true,"parentCommentId":"","children":[13,17,20],"text":"I don&#x27;t see any mention of the firmware and drivers efforts for this.
 Firmware and drivers always end up more difficult to deal with than expected.<p>The Fairphone company was surprised by difficulties upgrading and
 patching android without support from their BSP vendor, causing many months delays of updates _and_ years shorter support life than they were
 planning for their earlier models.<p>I purchased the Purism Librem 13 laptop from their kickstarter, and they had great plans for firmware and
 drivers, but also great difficulty following through. The trackpad chosen for the first models took much longer than expected to get upstream linux
 support, and it was never great (it turned out to be impossible to reliably detect their variant automatically). They finally hired someone with
 sufficient skill to do the coreboot port _months_ after initial units were delivered, and delivered polished coreboot firmware for their initial
 laptops _years_ after they started the kickstarter.<p>So, why should we have confidence in the firmware and drivers that Framework will deliver
 :)","points":1,"created":1614274058,"dead":false,"_id":12}`
`FT.SEARCH idx:comment (@dead:"false") (@_id:("3"|"7"|"11")) NOCONTENT LIMIT 0 10000 SORTBY _id DESC`

#### Submit[#](/learn/howtos/hackernews#submit)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fa825e26aa2fb42d49a65d5e60e282e3d&w=1920&q=75)
`GET item:id-indicator
 // Result - 4
 SET item:id-indicator 5`
`HSET item:4 id iBi8sU4HRcZ2 by andy1 title Firebase trends type ask url domain text Firebase Performance Monitoring is a service that helps you to
 gain insight into the performance characteristics of your iOS, Android, and web apps. points 1 score 0 created 1615571392 dead false _id 4`
`JSON.SET item:4 . '{"id":"iBi8sU4HRcZ2","by":"andy1","title":"Firebase trends","type":"ask","url":"","domain":"","text":"Firebase Performance
 Monitoring is a service that helps you to gain insight into the performance characteristics of your iOS, Android, and web
 apps.","points":1,"score":0,"commentCount":0,"created":1615571392,"dead":false,"_id":4}'`

#### Update Profile[#](/learn/howtos/hackernews#update-profile)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fc0e86c8b034d4eac92d37eb250a53631&w=1920&q=75)
`FT.SEARCH idx:user (@username:"andy1") NOCONTENT LIMIT 0 1 SORTBY _id DESC`
`JSON.MGET user:63 .`
`HSET user:63 username andy1 email created 1615569194 karma 1 about I am a software engineer. showDead false isModerator false shadowBanned false
 banned false _id 63`
`JSON.SET user:63 .
'{"username":"andy1","password":"$2a$10$zy8tsCske8MfmDX5CcWMce5S1U7PJbPI7CfaqQ7Bo1PORDeqJxqhe","authToken":"KJwPLN1idyQrMp5qEY5hR3VhoPFTKRcC8Npxxoju"," authTokenExpiration":1647106257,"email":"","created":1615569194,"karma":1,"about":"I am a software
 engineer.","showDead":false,"isModerator":false,"shadowBanned":false,"banned":false,"_id":63}'`

#### Moderation Logs screen[#](/learn/howtos/hackernews#moderation-logs-screen)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F5dc97b1abf20482daa864331789f5303&w=1920&q=75)
`FT.SEARCH idx:moderation-log * NOCONTENT LIMIT 0 0 SORTBY _id DESC
 // Result - [1,"moderation-log:1"]`
`JSON.MGET moderation-log:1 .`

#### Search[#](/learn/howtos/hackernews#search)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Ff685c2c455434abd813921f8b7df2780&w=1920&q=75)
`FT.SEARCH idx:item (@title:fa*) (-(@id:"aaaaaaaaa")) (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY score ASC
 // Result - [2,"item:18","item:16"]`
`JSON.MGET item:18 item:16 .`

## Example commands[#](/learn/howtos/hackernews#example-commands)

### There are 2 type of fields, indexed and non-indexed.[#](/learn/howtos/hackernews#there-are-2-type-of-fields-indexed-and-nonindexed)

When schema is created, it should created index.

`FT.CREATE idx:user ON hash PREFIX 1 "user:" SCHEMA username TEXT SORTABLE email TEXT SORTABLE karma NUMERIC SORTABLE`

Should drop/update index if the schema has changed

`FT.DROPINDEX idx:user`

Validate if the fields are indexed properly. If not, it will update the index fields or drop/recreate.

`FT.INFO idx:user`

It will require new hash and new JSON record

`HSET user:andy username "andy" email "[email protected]" karma 0`
`JSON.SET user:andy '{"passoword": "hashed_password", "settings": "{ \"showDead\": true }" }'`
`HSET user:1 username "newusername"`
`JSON.SET user:andy username "newusername"`
`FT.SEARCH idx:user '@username:{andy}'`

2. Fetch the JSON object to get the related JSON object

`JSON.GET user:andy`
`FT.SEARCH idx:user '@id:("andy1"|"andy2")'`
`FT.SEARCH idx:user '(-(@id:("andy1"|"andy2")))'`
`FT.SEARCH idx:user '(@id:"andy1") | (@username:"andy")'`
`FT.SEARCH idx:user '(@id:"andy1") (@username:"andy")'`
`FT.SEARCH idx:user '*' LIMIT 0 10 SORTBY username ASC`
`FT.SEARCH idx:user '*' LIMIT 10 20 SORTBY username ASC`
`JSON.MGET idx:user "andy1" "andy2" "andy3"`

## References[#](/learn/howtos/hackernews#references)

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

#### Join Redis University

#### Redis Query Engine

In this learning path, you will learn to query both structured and unstructured data in Redis using the Redis Search module.
