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

# How to build a Rate Limiter using Redis

![Ajeet Raina](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F241cb4ece2bb4c0fb6df75c4495182cd)

Rate limiting is a mechanism that many developers may have to deal with at some point in their life. It’s useful for a variety of purposes like sharing access to limited resources or limiting the number of requests made to an API endpoint and responding with a 429 status code.

In this tutorial, we will see how to implement Rate Limiting using various programming languages:

## References[#](/learn/howtos/ratelimiting#references)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F7ba01c6ccd224c82a5a814a1ef9e9533&w=1920&q=75)
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

## Step 1. Pre-requisite[#](/learn/howtos/ratelimiting#step-1-prerequisite)

## Step 2. Clone the repository[#](/learn/howtos/ratelimiting#step-2-clone-the-repository)

`git clone https://github.com/redis-developer/basic-rate-limiting-demo-python`

## Step 3. Run docker compose or install redis manually[#](/learn/howtos/ratelimiting#step-3-run-docker-compose-or-install-redis-manually)

`docker network create global
docker-compose up -d --build`

If you install redis manually open django-backend/configuration folder and copy `.env.example` to create `.env`. And provide the values for environment variables - REDIS_HOST: Redis server host - REDIS_PORT: Redis server port - REDIS_DB: Redis server db index - REDIS_PASSWORD: Redis server password

`.env.example`
`.env`

## Step 4. Setup and run[#](/learn/howtos/ratelimiting#step-4-setup-and-run)

Install python, pip and venv (on mac: <https://installpython3.com/mac/>)

Use python version: 3.8

`python3 -m venv venv
source ./venv/bin/activate
pip3 install -r requirements.txt
python3 manage.py collectstatic
python3 manage.py runserver`

Step 5. Accessing the rate limiting app

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F513566cd87904d448f8a27e22c042dcf&w=1920&q=75)

## How it works?[#](/learn/howtos/ratelimiting#how-it-works)

### How the data is stored:[#](/learn/howtos/ratelimiting#how-the-data-is-stored)

This app will block connections from a client after surpassing certain amount of requests (default: 10) per time (default: 10 sec) The application will return after each request the following headers. That will let the user know how many requests they have remaining before the run over the limit. On the 10th run server should return an HTTP status code of 429 Too Many Requests

SETNX is short for "SET if Not eXists". It basically sets key to hold string value if key does not exist. In that case, it is equal to SET. When key already holds a value, no operation is performed. New responses are added key-ip as shown below:

`SETNX your_ip:PING limit_amount
 Example: SETNX 127.0.0.1:PING 10`

[More information](https://redis.io/commands/setnx)

Set a timeout on key:

`EXPIRE your_ip:PING timeout
 Example: EXPIRE 127.0.0.1:PING 1000`

[More information](https://redis.io/commands/expire)

### How the data is accessed:[#](/learn/howtos/ratelimiting#how-the-data-is-accessed)

Next responses are get bucket:

`GET your_ip:PING
 Example: GET 127.0.0.1:PING`

[More information](https://redis.io/commands/get)

Next responses are changed bucket:

`DECRBY your_ip:PING amount
 Example: DECRBY 127.0.0.1:PING 1`

[More information](https://redis.io/commands/decrby)

#### Join Redis University

#### Get Started with Redis

This path is designed for developers who are new to Redis. Whether you’re ready to start using Redis in production or just interested in learning...
