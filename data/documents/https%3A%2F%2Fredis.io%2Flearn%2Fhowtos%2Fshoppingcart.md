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

# How to build a Shopping cart app using NodeJS and Redis

![Ajeet Raina](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F241cb4ece2bb4c0fb6df75c4495182cd)

It’s hard to imagine an online store without a shopping cart. Almost every online store must have the shopping cart functionality to be able to sell products to customers. In order to build a scalable ecommerce platform, you need a powerful framework and a simple storage system. At times, a lot of developers focus on improving the frontend performance of an ecommerce platform to rectify these things. The real bottleneck, however, remains the slow backend load time. A slow backend load time can have a serious impact on your search engine rankings. A good rule of thumb is that backend load time should take no more than 20% of your total load time. A good backend load time to aim for is 200ms or less. In this tutorial, you will see how to build a shopping cart application using Node.js, Vue.js, Express and Redis.

## Content[#](/learn/howtos/shoppingcart#content)

## What will you build?[#](/learn/howtos/shoppingcart#what-will-you-build)

This tutorial will show you how to harness the power of Redis by creating a basic ecommerce shopping cart application with Node.js. Usually, the shopping cart data is stored on the client-side as a cookie. Cookies are small text files stored in a web user's browser directory or data folder. The advantage of doing this is that you wouldn't need to store such temporary data in your database. However, this will require you to send the cookies with every web request, which can slow down the request in case of large cookies. Storing shopping cart data in Redis is a good idea since you can retrieve the items very fast at any time and persist this data if needed.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F0b81b1e6d3ed412c96e042dd3288e2fb&w=1920&q=75)

## What do you need?[#](/learn/howtos/shoppingcart#what-do-you-need)

Building an ecommerce app with Node.js makes a lot more sense because it ensures the balance between frontend and backend load time due to its asynchronous nature (the ability to handle multiple concurrent users at a time). Node.js helps developers make the best use of event loops and callbacks for I/O operations. Node.js runs single-threaded, non-blocking, asynchronous programming, which is very memory efficient.

In order to create a shopping cart we need a simple storage system where we can collect products and the cart's total. Node.js provides us with the express-session package, middleware for ExpressJS. We will be using express-session middleware to manage sessions in Node.js The session is stored in the express server itself.

The default server-side session storage, MemoryStore, is purposely not designed for a production environment. It will leak memory under most conditions, does not scale past a single process, and is meant for debugging and developing. To manage multiple sessions for multiple users, we have to create a global map and put each session object to it. Global variables in NodeJs are memory consuming and can prove to be terrible security holes in production-level projects.This can be solved by using an external session store. We have to store every session in the store so that each one will belong to only a single user. One popular session store is built using Redis.

We will start by setting up the backend for our application. Let’s create a new directory for our application and initialize a new Node.js application. Open up your terminal and type the following:

## Getting Started[#](/learn/howtos/shoppingcart#getting-started)

Clone the repository:

`$ git clone https://github.com/redis-developer/basic-redis-shopping-chart-nodejs`

### Running Redis Stack[#](/learn/howtos/shoppingcart#running-redis-stack)

You can use the below docker compose file to run Redis Stack server:

`version: '3'

services:
redis:
image: redis/redis-stack:latest
container_name: redis.redisshoppingcart.docker
restart: unless-stopped
environment:
REDIS_PASSWORD: ${REDIS_PASSWORD}
ports:

- 127.0.0.1:${REDIS_PORT}:6379
  networks:
- global
  networks:
  global:
  external: true`

I assume that you have Docker and Docker Compose up and installed on your local environment. Execute the below compose CLI to bring up Redis server:

`$ docker network create global
$ docker-compose up -d --build`

The `docker-compose ps` shows the list of running Redis services:

`docker-compose ps`
`$ docker-compose ps
Name Command State Ports
redis.redisshoppingcart.docker docker-entrypoint.sh redis ... Up 127.0.0.1:55000->6379/tcp`

## Setting up the backend server[#](/learn/howtos/shoppingcart#setting-up-the-backend-server)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F85a9061551224dd4a09ba70016177b99&w=1920&q=75)

Node.js is a runtime environment that allows software developers to launch both the frontend and backend of web apps using JavaScript. To save your time, the directory /server/src has already been created for you.This is where we will be creating our modules by adding the following sub-directories -

Routes forward the supported requests (and any information encoded in request URLs) to the appropriate controller functions, whereas controller functions get the requested data from the models, create an HTML page displaying the data, and return it to the user to view in the browser. Services hold your actual business logic. Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle.

### Project directory structure[#](/learn/howtos/shoppingcart#project-directory-structure)

`% tree
.
├── controllers
│ ├── Cart
│ │ ├── DeleteItemController.js
│ │ ├── EmptyController.js
│ │ ├── IndexController.js
│ │ └── UpdateController.js
│ └── Product
│ ├── IndexController.js
│ └── ResetController.js
├── index.js
├── middleware
│ └── checkSession.js
├── products.json
├── routes
│ ├── cart.js
│ ├── index.js
│ └── products.js
└── services
 └── RedisClient.js
6 directories, 13 files`

Let us first initialize the application server through the index.js shown below:

`// server/src/index.js

const express = require('express');
const redis = require('redis');
const rejson = require('redis-rejson');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const RedisClient = require('./services/RedisClient');

rejson(redis);

require('dotenv').config();

const { REDIS_ENDPOINT_URI, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, PORT } = process.env;

const app = express();

app.use(
cors({
origin(origin, callback) {
callback(null, true);
},
credentials: true
})
);

const redisEndpointUri = REDIS_ENDPOINT_URI
? REDIS_ENDPOINT_URI.replace(/^(redis\:\/\/)/, '')
: `${REDIS_HOST}:${REDIS_PORT}`;

const redisClient = redis.createClient(`redis://${redisEndpointUri}`, {
password: REDIS_PASSWORD
});

const redisClientService = new RedisClient(redisClient);

app.set('redisClientService', redisClientService);

app.use(
session({
store: new RedisStore({ client: redisClient }),
secret: 'someSecret',
resave: false,
saveUninitialized: false,
rolling: true,
cookie: {
maxAge: 3600 _ 1000 _ 3
}
})
);

app.use(bodyParser.json());

app.use('/', express.static(path.join(\_\_dirname, '../../client-dist')));

const router = require('./routes')(app);

app.use('/api', router);

const port = PORT || 3000;

app.listen(port, () => {
console.log(`App listening on port ${port}`);
});`

You'll see that the responsibility of this index.js is to simply set up the server. It initializes all the middleware, sets up the view engine, etc. The last thing to do is set up routes by deferring that responsibility to the index.js within the routes folder.

As shown above, app.use, app.set, and app.listen are endpoints, for the purposes of this demo, we will need to be able to add and get items from the basket ( Keeping it simple ). We need to define our basic routes to get all products, get single product details, remove products, and create products.

### Routes[#](/learn/howtos/shoppingcart#routes)

The routes directory is only responsible for defining our routes. Within index.js in this folder, you'll see that its responsibility is to set up our top level routes and delegate their responsibilities to each of their respective route files. Each respective route file will further define any additional subroutes and controller actions for each one.

The web server skeleton already has a ./routes folder containing routes for the index, products and cart. (as shown under <https://github.com/redis-developer/basic-redis-shopping-chart-nodejs/tree/main/server/src/routes>)

`// routes/index.js

const fs = require('fs');
const express = require('express');
const router = express.Router();

module.exports = app => {
fs.readdirSync(\_\_dirname).forEach(function (route) {
route = route.split('.')[0];

if (route === 'index') {
return;
}

router.use(`/${route}`, require(`./${route}`)(app));
});

return router;
};`

A route is a section of Express code that associates an HTTP verb (GET, POST, PUT, DELETE, etc.), a URL path/pattern, and a function that is called to handle that pattern. There are several ways to create routes. For this demo app we're going to use the express.Router middleware as it allows us to group the route handlers for a particular part of a site together and access them using a common route-prefix. The module requires Express and then uses it to create a Router object. The routes are all set up on the router, which is then exported.The routes are defined either using .get() or .post() methods on the router object. All the paths are defined using strings (we don't use string patterns or regular expressions). Routes that act on some specific resource (e.g. book) use path parameters to get the object id from the URL. The handler functions are all imported from the controller modules we created in the previous section.

### Controllers[#](/learn/howtos/shoppingcart#controllers)

Controllers are responsible for invoking the appropriate action. If a controller's responsibility is to render a view, it will render the appropriate view from the app/views directory.

`// controller/Product/IndexController.js

const { products } = require('../../products.json');

class ProductIndexController {
constructor(redisClientService) {
this.redisClientService = redisClientService;
}

async index(req, res) {
const productKeys = await this.redisClientService.scan('product:\*');
const productList = [];

if (productKeys.length) {
for (const key of productKeys) {
const product = await this.redisClientService.jsonGet(key);

productList.push(JSON.parse(product));
}

return res.send(productList);
}

for (const product of products) {
const { id } = product;

await this.redisClientService.jsonSet(`product:${id}`, '.', JSON.stringify(product));

productList.push(product);
}

return res.send(productList);
}
}

module.exports = ProductIndexController;`

### Services[#](/learn/howtos/shoppingcart#services)

Services hold your actual business logic.The service layer carries out the application logic and delegates CRUD operations to a database/persistent storage (Redis in our case). Let us look at each condition and try to understand how the data is stored, modified, and accessed:

### How the data is stored:[#](/learn/howtos/shoppingcart#how-the-data-is-stored)

The product data is stored in an external JSON file. After the first request, this data is saved in a JSON data type in Redis like:

`JSON.SET product:{productId} . '{ "id": "productId", "name": "Product Name", "price": "375.00", "stock": 10 }'.`

### Example:[#](/learn/howtos/shoppingcart#example)

The cart data is stored in a hash like:

`HSET cart:{cartId} product:{productId} {productQuantity},`

where cartId is a random generated value and stored in the user session. Please note that Redis’s hash management command HSET stores 2 keys-cart and product-as shown in the below example.

### Example:[#](/learn/howtos/shoppingcart#example)

`HSET cart:77f7fc881edc2f558e683a230eac217d product:e182115a-63d2-42ce-8fe0-5f696ecdfba6 1`

### How the data is modified:[#](/learn/howtos/shoppingcart#how-the-data-is-modified)

The product data is modified like

`JSON.SET product:{productId} . '{ "id": "productId", "name": "Product Name", "price": "375.00", "stock": {newStock} }'.`

### Example:[#](/learn/howtos/shoppingcart#example)

`JSON.SET product:e182115a-63d2-42ce-8fe0-5f696ecdfba6 . '{ "id": "e182115a-63d2-42ce-8fe0-5f696ecdfba6", "name": "Brilliant Watch", "price": "250.00", "stock": 1 }'`

The cart data is modified like

`HSET cart:{cartId} product:{productId} {newProductQuantity} or HINCRBY cart:{cartId} product:{productId} {incrementBy}.`

### Example:[#](/learn/howtos/shoppingcart#example)

`HSET cart:77f7fc881edc2f558e683a230eac217d product:e182115a-63d2-42ce-8fe0-5f696ecdfba6 2

HINCRBY cart:77f7fc881edc2f558e683a230eac217d product:e182115a-63d2-42ce-8fe0-5f696ecdfba6 1

HINCRBY cart:77f7fc881edc2f558e683a230eac217d product:e182115a-63d2-42ce-8fe0-5f696ecdfba6 -1`

The product can be removed from the cart like

`HDEL cart:{cartId} product:{productId}`

### Example:[#](/learn/howtos/shoppingcart#example)

`HDEL cart:77f7fc881edc2f558e683a230eac217d product:e182115a-63d2-42ce-8fe0-5f696ecdfba6`

The cart can be cleared using

`HGETALL cart:{cartId} and then HDEL cart:{cartId} {productKey} in loop.`

### Example:[#](/learn/howtos/shoppingcart#example)

`HGETALL cart:77f7fc881edc2f558e683a230eac217d => product:e182115a-63d2-42ce-8fe0-5f696ecdfba6, product:f9a6d214-1c38-47ab-a61c-c99a59438b12, product:1f1321bb-0542-45d0-9601-2a3d007d5842 => HDEL cart:77f7fc881edc2f558e683a230eac217d product:e182115a-63d2-42ce-8fe0-5f696ecdfba6, HDEL cart:77f7fc881edc2f558e683a230eac217d product:f9a6d214-1c38-47ab-a61c-c99a59438b12, HDEL cart:77f7fc881edc2f558e683a230eac217d product:1f1321bb-0542-45d0-9601-2a3d007d5842`

All carts can be deleted when reset data is requested like:

`SCAN {cursor} MATCH cart:* and then DEL cart:{cartId} in loop.`

### Example:[#](/learn/howtos/shoppingcart#example)

`SCAN {cursor} MATCH cart:* => cart:77f7fc881edc2f558e683a230eac217d, cart:217dedc2f558e683a230eac77f7fc881, cart:1ede77f558683a230eac7fc88217dc2f => DEL cart:77f7fc881edc2f558e683a230eac217d, DEL cart:217dedc2f558e683a230eac77f7fc881, DEL cart:1ede77f558683a230eac7fc88217dc2f`

### How the data is accessed:[#](/learn/howtos/shoppingcart#how-the-data-is-accessed)

Products: SCAN {cursor} MATCH product:\* to get all product keys and then JSON.GET {productKey}

### Example:[#](/learn/howtos/shoppingcart#example)

`SCAN {cursor} MATCH product:* => product:e182115a-63d2-42ce-8fe0-5f696ecdfba6, product:f9a6d214-1c38-47ab-a61c-c99a59438b12, product:1f1321bb-0542-45d0-9601-2a3d007d5842
=> JSON.GET product:e182115a-63d2-42ce-8fe0-5f696ecdfba6, JSON.GET product:f9a6d214-1c38-47ab-a61c-c99a59438b1, JSON.GET product:1f1321bb-0542-45d0-9601-2a3d007d5842`

Cart: HGETALL cart:{cartId} to get quantity of products and JSON.GET product:{productId} to get products data in loop.

### Example:[#](/learn/howtos/shoppingcart#example)

`HGETALL cart:77f7fc881edc2f558e683a230eac217d => product:e182115a-63d2-42ce-8fe0-5f696ecdfba6 (quantity: 1), product:f9a6d214-1c38-47ab-a61c-c99a59438b12 (quantity: 0), product:1f1321bb-0542-45d0-9601-2a3d007d5842 (quantity: 2) => JSON.GET product:e182115a-63d2-42ce-8fe0-5f696ecdfba6, JSON.GET product:f9a6d214-1c38-47ab-a61c-c99a59438b12, JSON.GET product:1f1321bb-0542-45d0-9601-2a3d007d5842`

HGETALL returns an array of keys and corresponding values from hash data type. Open up RedisClient.js file using your favourite editor as shown below:

`// services/RedisClient.js

const { promisify } = require('util');

class RedisClient {
constructor(redisClient) {
['json_get', 'json_set', 'hgetall', 'hset', 'hget', 'hdel', 'hincrby', 'del', 'scan'].forEach(
method => (redisClient[method] = promisify(redisClient[method]))
);
this.redis = redisClient;
}

async scan(pattern) {
let matchingKeysCount = 0;
let keys = [];

const recursiveScan = async (cursor = '0') => {
const [newCursor, matchingKeys] = await this.redis.scan(cursor, 'MATCH', pattern);
cursor = newCursor;

matchingKeysCount += matchingKeys.length;
keys = keys.concat(matchingKeys);

if (cursor === '0') {
return keys;
} else {
return await recursiveScan(cursor);
}
};

return await recursiveScan();
}

jsonGet(key) {
return this.redis.json_get(key);
}

jsonSet(key, path, json) {
return this.redis.json_set(key, path, json);
}

hgetall(key) {
return this.redis.hgetall(key);
}

hset(hash, key, value) {
return this.redis.hset(hash, key, value);
}

hget(hash, key) {
return this.redis.hget(hash, key);
}

hdel(hash, key) {
return this.redis.hdel(hash, key);
}

hincrby(hash, key, incr) {
return this.redis.hincrby(hash, key, incr);
}

del(key) {
return this.redis.del(key);
}
}

module.exports = RedisClient;`

### How does the overall process work?[#](/learn/howtos/shoppingcart#how-does-the-overall-process-work)

The process flow is fairly straightforward. Once a request is sent to an endpoint on this shopping cart application e.g http://localhost:8081/. It first hits the router for that endpoint and then if it is a public endpoint such as this one it goes to the controller that handles that. As an analogy, the controller is just like a manager, while the service is the worker. A controller manages the incoming work HTTP requests whereas services receives the request data it needs from the manager in order to perform its tasks

Next, we create routes for a cart in a module named cart.js. The code first imports the Express application object, uses it to get a Router object and then adds a couple of routes to it using the get() method. Last of all the module returns the Router object.

First let us define the product model to our controllers/Product/IndexController.js file(<https://github.com/redis-developer/basic-redis-shopping-chart-nodejs/tree/main/server/src/controllers/Product>):

Our product model will be basic as possible as it holds the product name, price and image.

`{
 "products": [
 {
 "id": "e182115a-63d2-42ce-8fe0-5f696ecdfba6",
 "name": "Brilliant Watch",
 "price": "250.00",
 "stock": 2
 },
 {
 "id": "f9a6d214-1c38-47ab-a61c-c99a59438b12",
 "name": "Old fashion cellphone",
 "price": "24.00",
 "stock": 2
 },
 {
 "id": "1f1321bb-0542-45d0-9601-2a3d007d5842",
 "name": "Modern iPhone",
 "price": "1000.00",
 "stock": 2
 },
 {
 "id": "f5384efc-eadb-4d7b-a131-36516269c218",
 "name": "Beautiful Sunglasses",
 "price": "12.00",
 "stock": 2
 },
 {
 "id": "6d6ca89d-fbc2-4fc2-93d0-6ee46ae97345",
 "name": "Stylish Cup",
 "price": "8.00",
 "stock": 2
 },
 {
 "id": "efe0c7a3-9835-4dfb-87e1-575b7d06701a",
 "name": "Herb caps",
 "price": "12.00",
 "stock": 2
 },
 {
 "id": "x341115a-63d2-42ce-8fe0-5f696ecdfca6",
 "name": "Audiophile Headphones",
 "price": "550.00",
 "stock": 2
 },
 {
 "id": "42860491-9f15-43d4-adeb-0db2cc99174a",
 "name": "Digital Camera",
 "price": "225.00",
 "stock": 2
 },
 {
 "id": "63a3c635-4505-4588-8457-ed04fbb76511",
 "name": "Empty Bluray Disc",
 "price": "5.00",
 "stock": 2
 },
 {
 "id": "97a19842-db31-4537-9241-5053d7c96239",
 "name": "256BG Pendrive",
 "price": "60.00",
 "stock": 2
 }
 ]
}`

### Testing the Server[#](/learn/howtos/shoppingcart#testing-the-server)

Copy `.env.example` to `.env` file and set environment variables as shown below:

`.env.example`
`.env`
`REDIS_PORT=6379
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=demo
COMPOSE_PROJECT_NAME=redis-shopping-cart`

###### Info

In case you’re using Redis Cloud instead of localhost, then you need to enter the database endpoint under REDIS_HOST (without port) while rest of the entries like REDIS_PORT and REDIS_PASSWORD are quite obvious

### Installing the dependencies[#](/learn/howtos/shoppingcart#installing-the-dependencies)

`$ npm install`

### Testing the Routes[#](/learn/howtos/shoppingcart#testing-the-routes)

After adding this, you can run your application by typing npm install in your terminal. Once you run this command, it will return Application is running on 3000.

`$ npm run dev`
`$ npm run dev

> [email protected] dev
> nodemon src/index.js
> [nodemon] 2.0.7
> [nodemon] to restart at any time, enter `rs`
> [nodemon] watching path(s): _._
> [nodemon] watching extensions: js,mjs,json
> [nodemon] starting `node src/index.js`
> App listening on port 3000`

## Setting up the frontend web Client using Vue.js[#](/learn/howtos/shoppingcart#setting-up-the-frontend-web-client-using-vuejs)

Now that we have the application’s backend running, let us begin developing its frontend. We will be leveraging Vue.js - a robust but simple JavaScript framework for building our frontend web client. It has one of the lowest barriers to entry of any modern framework while providing all the required features for high performance web applications.

`.
├── README.md
├── babel.config.js
├── node_modules
├── package-lock.json
├── package.json
├── public
├── src
└── vue.config.js`

The files at the root level (babel.config.js, package.json, node_modules) are used to configure the project. The most interesting part, at least for now, is located in the src directory(directory structure is shown below):

The main.js file is the main JavaScript file of the application, which will load all common elements and call the App.vue main screen. The App.vue is a file that contains in the HTML, CSS, and JavaScript for a specific page or template. As an entry point for the application, this part is shared by all screens by default, so it is a good place to write the notification-client piece in this file. The public/index.html is the static entry point from where the DOM will be loaded.

### Directory Structure:[#](/learn/howtos/shoppingcart#directory-structure)

`% tree
.
├── App.vue
├── assets
│ ├── RedisLabs_Illustration.svg
│ └── products
│ ├── 1f1321bb-0542-45d0-9601-2a3d007d5842.jpg
│ ├── 42860491-9f15-43d4-adeb-0db2cc99174a.jpg
│ ├── 63a3c635-4505-4588-8457-ed04fbb76511.jpg
│ ├── 6d6ca89d-fbc2-4fc2-93d0-6ee46ae97345.jpg
│ ├── 97a19842-db31-4537-9241-5053d7c96239.jpg
│ ├── e182115a-63d2-42ce-8fe0-5f696ecdfba6.jpg
│ ├── efe0c7a3-9835-4dfb-87e1-575b7d06701a.jpg
│ ├── f5384efc-eadb-4d7b-a131-36516269c218.jpg
│ ├── f9a6d214-1c38-47ab-a61c-c99a59438b12.jpg
│ └── x341115a-63d2-42ce-8fe0-5f696ecdfca6.jpg
├── components
│ ├── Cart.vue
│ ├── CartItem.vue
│ ├── CartList.vue
│ ├── Info.vue
│ ├── Product.vue
│ ├── ProductList.vue
│ └── ResetDataBtn.vue
├── config
│ └── index.js
├── main.js
├── plugins
│ ├── axios.js
│ └── vuetify.js
├── store
│ ├── index.js
│ └── modules
│ ├── cart.js
│ └── products.js
└── styles
 └── styles.scss
8 directories, 27 files`

In the client directory, under the subdirectory src, open the file App.vue. You will see the below content:

`<template>
<v-app>
<v-container>

 <div class="my-8 d-flex align-center">
 <div class="pa-4 rounded-lg red darken-1">
 <v-icon color="white" size="45">mdi-cart-plus</v-icon>
 </div>
 <h1 class="ml-6 font-weight-regular">Shopping Cart demo</h1>
 </div>
 </v-container>

 <v-container>
 <v-row>
 <v-col cols="12" sm="7" md="8">
 <info />
 <product-list :products="products" />
 </v-col>
 <v-col cols="12" sm="5" md="4" class="d-flex flex-column">
 <cart />
 <reset-data-btn class="mt-6" />
 </v-col>
 </v-row>

 <v-footer class="mt-12 pa-0">
 © Copyright 2021 | All Rights Reserved Redis
 </v-footer>
 </v-container>
 </v-app>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Cart from '@/components/Cart';
import ProductList from '@/components/ProductList';
import ResetDataBtn from '@/components/ResetDataBtn.vue';
import Info from '@/components/Info';
export default {
 name: 'App',
 components: {
 ProductList,
 Cart,
 ResetDataBtn,
 Info
 },
 computed: {
 ...mapGetters({
 products: 'products/getProducts'
 })
 },
 async created() {
 await this.fetchProducts();
 },
 methods: {
 ...mapActions({
 fetchProducts: 'products/fetch'
 })
 }
};
</script>`

This is client-side code. Here API returns, among other things, links to icons suitable for use on Maps. If you follow the flow through, you’ll see the map markers are loading those icons directly using the include URLs.

### Running/Testing the web client[#](/learn/howtos/shoppingcart#runningtesting-the-web-client)

`$ cd client
$ npm run serve

> [email protected] serve
> vue-cli-service serve
> INFO Starting development server...
> 98% after emitting CopyPlugin
> DONE Compiled successfully in 7733ms 7:15:56 AM

App running at:

- Local: http://localhost:8081/
- Network: http://192.168.43.81:8081/
  Note that the development build is not optimized.
  To create a production build, run npm run build.`

Let us click on the first item “256GB Pendrive” and try to check out this product. Once you add it to the cart, you will see the below output using redis-cli monitor command:

`1613320256.801562 [0 172.22.0.1:64420] "json.get" "product:97a19842-db31-4537-9241-5053d7c96239"
1613320256.803062 [0 172.22.0.1:64420] "hget"
...
1613320256.805950 [0 172.22.0.1:64420] "json.set" "product:97a19842-db31-4537-9241-5053d7c96239" "." "{\"id\":\"97a19842-db31-4537-9241-5053d7c96239\",\"name\":\"256BG Pendrive\",\"price\":\"60.00\",\"stock\":1}"
1613320256.807792 [0 172.22.0.1:64420] "set" "sess:Ii9njXZd6zeUViL3tKJimN5zU7Samfze"
...
1613320256.823055 [0 172.22.0.1:64420] "scan" "0" "MATCH" "product:*"
...
1613320263.232527 [0 172.22.0.1:64420] "hgetall" "cart:bdee1606395f69985e8f8e01d3ada8c4"
1613320263.233752 [0 172.22.0.1:64420] "set" "sess:gXk5K9bobvrR790-HFEoi3bQ2kP9YmjV" "{\"cookie\":{\"originalMaxAge\":10800000,\"expires\":\"2021-02-14T19:31:03.233Z\",\"httpOnly\":true,\"path\":\"/\"},\"cartId\":\"bdee1606395f69985e8f8e01d3ada8c4\"}" "EX" "10800"
1613320263.240797 [0 172.22.0.1:64420] "scan" "0" "MATCH" "product:*"
1613320263.241908 [0 172.22.0.1:64420] "scan" "22" "MATCH" "product:*"
…
"{\"cookie\":{\"originalMaxAge\":10800000,\"expires\":\"2021-02-14T19:31:03.254Z\",\"httpOnly\":true,\"path\":\"/\"},\"cartId\":\"4bc231293c5345370f8fab83aff52cf3\"}" "EX" "10800"`
![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F7cca99a2520544918b92f3d13865f457&w=1920&q=75)

## Conclusion[#](/learn/howtos/shoppingcart#conclusion)

Storing shopping cart data in Redis is a good idea because it lets you retrieve the data very fast at any time and persist this data if needed. As compared to cookies that store the entire shopping cart data in session that is bloated and relatively slow in operation, storing the shopping cart data in Redis speeds up the shopping cart’s read and write performance , thereby improving the user experience.

## Reference[#](/learn/howtos/shoppingcart#reference)

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
