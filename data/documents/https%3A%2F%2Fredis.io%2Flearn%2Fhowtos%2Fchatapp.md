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

# How to build a Chat application using Redis

![Ajeet Raina](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F241cb4ece2bb4c0fb6df75c4495182cd)

Real-time chat app is an online communication channel that allows you to conduct real-time conversations. More and more developers are tapping into the power of Redis as it is extremely fast & due to its support for variety of rich data structure such as Lists, Sets, Sorted Sets, Hashes etc. Redis comes along with a Pub/Sub messaging feature functionality that allows developers to scale the backend by spawning multiple server instances.

###### WARNING

While the traditional chat application tutorial on Redis remains insightful, we encourage you to dive into our [AI chatbot tutorial](https://redis.io/learn/howtos/solutions/vector/gen-ai-chatbot) to unlock the potential of modern conversational experiences.

###### INFO

Please note that this code is open source. You can find the link at the end of this tutorial.

In this tutorial, we will see how to develop real time messaging apps with Flask, Socket.IO and Redis. This example uses Redis Pub/sub feature combined with websockets for implementing the real time chat app communication between client and server.

###### INFO

Please note that this code is open source and implements the basic features of a live chat app. You can find the link at the end of this tutorial.

## Step 1. Prerequisites[#](/learn/howtos/chatapp#step-1-prerequisites)

In order to perform this instant messaging app development, you will need the following software:

## Step 2. Clone the repository[#](/learn/howtos/chatapp#step-2-clone-the-repository)

First of all, we will clone the project that implements basic chat functionality.

`git clone https://github.com/redis-developer/basic-redis-chat-app-demo-python`

## Step 3. Installing the requred packages[#](/learn/howtos/chatapp#step-3-installing-the-requred-packages)

`cd client
yarn install`

## Step 4. Starting the frontend[#](/learn/howtos/chatapp#step-4-starting-the-frontend)

To run the frontend of the chat app, run the following command:

`yarn start`
`You can now access a chat window in the browser.
 Local: http://localhost:3000
 On Your Network: http://192.168.1.9:3000`
![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F0367808ac02d43d0ba2cc7902a01b3b7&w=1080&q=75)

## Step 5. Installing the required Python modules[#](/learn/howtos/chatapp#step-5-installing-the-required-python-modules)

`cd ..
pip3 install -r requirements.txt`

## Step 6. Running the Backend[#](/learn/howtos/chatapp#step-6-running-the-backend)

To start the fully chat app, run the following commands:

`python3 -m venv venv/
source venv/bin/activate
python3 app.py`
`python3 app.py

- Restarting with stat
- Debugger is active!
- Debugger PIN: 220-696-610
  (8122) wsgi starting up on http://127.0.0.1:5000`
  ![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F11d14a7d1ef54663938905a0d6dab1c2&w=1920&q=75)

## How does it work?[#](/learn/howtos/chatapp#how-does-it-work)

This instant messaging app server works as a basic REST API which involves keeping the session and handling the user state in the chat room (besides the WebSocket/real-time part). When the server starts, the initialization step occurs. At first, a new Redis connection is established and it's checked whether it's needed to load the demo data.

### Initialization[#](/learn/howtos/chatapp#initialization)

For simplicity, a key with total_users value is checked: if it does not exist, we fill the Redis database with initial data. EXISTS total_users (checks if the key exists) The demo data initialization is handled in multiple steps:

### Creating of demo users[#](/learn/howtos/chatapp#creating-of-demo-users)

We create a new user id: INCR total_users. Then we set a user ID lookup key by user name: e.g.

`SET username:nick user:1`

And finally, the rest of the data is written to the hash set:

Example:

`HSET user:1 username "nick" password "bcrypt_hashed_password".`

Additionally, each user is added to the default "General" room. For handling chat rooms for each user, we have a set that holds the chat room ids. Here's an example command of how to add the room:

`SADD user:1:rooms "0"`

Populate private messages between users. At first, private rooms are created: if a private room needs to be established, for each user a room id: room:1:2 is generated, where numbers correspond to the user ids in ascending order.

E.g. Create a private room between 2 users:

`SADD user:1:rooms 1:2 and SADD user:2:rooms 1:2`

Then we add messages to this room by writing to a sorted set:

`ZADD room:1:2 1615480369 "{'from': 1, 'date': 1615480369, 'message': 'Hello', 'roomId': '1:2'}"`

We use a stringified JSON for keeping the message structure and simplify the implementation details for this demo-app.

Populate the "General" room with messages. Messages are added to the sorted set with id of the "General" room: room:0

### Pub/sub[#](/learn/howtos/chatapp#pubsub)

After initialization, a pub/sub subscription is created: SUBSCRIBE MESSAGES. At the same time, each server instance will run a listener on a message on this channel to receive real-time updates.

Again, for simplicity, each message is serialized to JSON, which we parse and then handle in the same manner, as WebSocket messages.

Pub/sub allows connecting multiple servers written in different platforms without taking into consideration the implementation detail of each server.

### Real-time chat and session handling[#](/learn/howtos/chatapp#realtime-chat-and-session-handling)

When a WebSocket/real-time server is instantiated, which listens for the next
events:

A global set with online_users key is used for keeping the online state for
each user. So on a new connection, a user ID is written to that set:

`SADD online_users 1`

Here we have added user with id 1 to the set online_users

After that, a message is broadcasted to the clients to notify them that a new user is joined the chat.

`PUBLISH message "{'serverId': 4132, 'type':'message', 'data': {'from': 1, 'date': 1615480369, 'message': 'Hello', 'roomId': '1:2'}}"`

Note we send additional data related to the type of the message and the server id. Server id is used to discard the messages by the server instance which sends them since it is connected to the same MESSAGES channel.

The type field of the serialized JSON corresponds to the real-time method we use for real-time communication (connect/disconnect/message).

The data is method-specific information. In the example above it's related to the new message.

## How the data is stored?[#](/learn/howtos/chatapp#how-the-data-is-stored)

Redis is used mainly as a database to keep the user/messages data and for sending messages between connected servers.

The real-time functionality is handled by Socket.IO for server-client messaging. Additionally each server instance subscribes to the MESSAGES channel of pub/sub and dispatches messages once they arrive. Note that, the server transports pub/sub messages with a separate event stream (handled by Server Sent Events), this is due to the need of running pub/sub message loop apart from socket.io signals.

The chat data is stored in various keys and various data types.
User data is stored in a hash set where each user entry contains the next values:

username: unique user name;

password: hashed password

Additionally a set of chat rooms is associated with user

Rooms are sorted sets which contains messages where score is the timestamp for each message

Each chat room has a name associated with it

The "online" set is global for all users is used for keeping track on which user is online.

Each user hash's set is accessed by key user:{userId}. The data for it stored with `HSET key field data`. User ID is calculated by incrementing the `total_users` key (`INCR total_users`)

`HSET key field data`
`total_users`
`INCR total_users`

Usernames are stored as separate keys (`username:{username}`) which returns the userId for quicker access and stored with `SET username:{username} {userId}`.

`username:{username}`
`SET username:{username} {userId}`

Rooms which a user belongs to are stored at `user:{userId}:rooms` as a set of chat room ids. A room is added by `SADD user:{userId}:rooms {roomId}` command.

`user:{userId}:rooms`
`SADD user:{userId}:rooms {roomId}`

Messages are stored at `room:{roomId}` key in a sorted set (as mentioned above). They are added with the `ZADD room:{roomId} {timestamp} {message}` command. Messages are serialized to an app-specific JSON string.

`room:{roomId}`
`ZADD room:{roomId} {timestamp} {message}`

## How the data is accessed?[#](/learn/howtos/chatapp#how-the-data-is-accessed)

Get User HGETALL user:{id}.

`HGETALL user:2`

where we get data for the user with id: 2.

`SMEMBERS user:2:rooms`

This will return IDs of chat rooms for user with ID: 2

`ZREVRANGE room:{roomId} {offset_start} {offset_end}`
`ZREVRANGE room:1:2 0 50`

It will return 50 messages with 0 offsets for the private room between users with IDs 1 and 2.

## Related Posts[#](/learn/howtos/chatapp#related-posts)

#### Join Redis University

#### Get Started with Redis Cloud

Go from sign up to production in less than 2 hours with Redis Cloud. This path walks you through the process step-by-step...

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
