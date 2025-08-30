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

# How to Build a Social Network Application using Redis Stack and NodeJS

![Julian Mateu](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F56932e8e5f6541d4bf53df9e3147525f)
![Manuel Aguirre](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F71d07fe4e7674ad0b577f66807cdbde1)
![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F2a38946cd70b4387994bddc76a3620fe&w=1920&q=75)

In this blog post we’ll build a social network application using Redis Stack and NodeJS. This is the idea that we used for our app [Skillmarket](https://www.youtube.com/watch?v=18NPKZy28cQ).

The goal of the application is to match users with complementary skills. It will allow users to register and provide some information about themselves, like location, areas of expertise and interests. Using search in Redis Stack it will match two users who are geographically close, and have complementary areas of expertise and interests, e.g., one of them knows French and want to learn Guitar and the other knows Guitar and want to learn French.

The full source code of our application can be found in GitHub (note that we used some features like [FT.ADD](https://oss.redis.com/redisearch/Commands/#ftadd) which now are deprecated):

We will be using a more condensed version of the backend which can be found in the [Skillmarket Blogpost](https://github.com/julianmateu/skillmarket-blogpost) GitHub repo.

Refer to the [official tutorial](https://github.com/RediSearch/redisearch-getting-started) for more information about search in Redis Stack.

## Getting Familiar with search in Redis Stack[#](/learn/howtos/socialnetwork#getting-familiar-with-search-in-redis-stack)

### Launching search in RedisStack in a Docker container[#](/learn/howtos/socialnetwork#launching-search-in-redisstack-in-a-docker-container)

Let’s start by launching Redis from the Redis Stack image using Docker:

`docker run -d --name redis redis/redis-stack:latest`

Here we use the `docker run` command to start the container and pull the image if it is not present. The `-d` flag tells docker to launch the container in the background (detached mode). We provide a name with `--name redis` which will allow us to refer to this container with a friendly name instead of the hash or the random name docker will assign to it.

`docker run`
`-d`
`--name redis`

Finally, `redislabs/readisearch:latest` tells docker to use the `latest` version of the `redislabs/readisearch image`

`redislabs/readisearch:latest`
`latest`
`redislabs/readisearch image`

Once the image starts, we can use `docker exec` to launch a terminal inside the container, using the `-it` flag (interactive tty) and specifying the `redis` name provided before when creating the image, and the `bash` command:

`docker exec`
`-it`
`redis`
`bash`
`docker exec -it redis bash`

Once inside the container, let’s launch a `redis-cli` instance to familiarize ourselves with the CLI:

`redis-cli`
`redis-cli`

You will notice the prompt now indicates we’re connected to `127.0.0.1:6379`

`127.0.0.1:6379`

### Creating Users[#](/learn/howtos/socialnetwork#creating-users)

We’ll use a Hash as the data structure to store information about our users. This will be a proof of concept, so our application will only use Redis as the data store. For a real life scenario, it would probably be better to have a primary data store which is the authoritative source of user data, and use Redis as the search index which can be used to speed up searches.

In a nutshell, you can think of a hash as a key/value store where the key can be any string we want, and the values are a document with several fields. It’s common practise to use the hash to store many different types of objects, so they can be prefixed with their type, so a key would take the form of "object_type:id".

An index will then be used on this hash data structure, to efficiently search for values of given fields. The following diagram taken from the search docs exeplifies this with a database for movies:

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F7938563ac239439c8839b181201f34c3&w=1920&q=75)

Use the `help @hash` command (or refer to the [documentation](https://redis.io/commands#hash)) to get a list of commands that can be used to manipulate hashes. To get help for a single command, like `HSET` let’s type `help HSET`:

`help @hash`
`HSET`
`help HSET`
`127.0.0.1:6379> help hset
 HSET key field value [field value ...]
 summary: Set the string value of a hash field
 since: 2.0.0
 group: hash`

As we see, we can provide a key and a list of `field value` pairs.

`field value`

We’ll create a user in the hash table by using `user:id` as the key, and we’ll provide the fields `expertises`, `interests` and `location`:

`user:id`
`expertises`
`interests`
`location`
`HSET users:1 name "Alice" expertises "piano, dancing" interests "spanish, bowling" location "2.2948552,48.8736537"

HSET users:2 name "Bob" expertises "french, spanish" interests "piano" location "2.2945412,48.8583206"

HSET users:3 name "Charles" expertises "spanish, bowling" interests "piano, dancing" location "-0.124772,51.5007169"`

### Query to match users[#](/learn/howtos/socialnetwork#query-to-match-users)

Here we can see the power of the search index, which allows us to query by [tags](https://redis.io/docs/interact/search-and-query/advanced-concepts/tags/) (we provide a list of values, such as interests, and it will return any user whose interests match at least one value in the list), and [Geo](https://oss.redis.com/redisearch/Query_Syntax/#geo_filters_in_query) (we can ask for users whose location is at a given radius in km from a point).

To be able to do this, we have to instruct search to create an index:

`FT.CREATE idx:users ON hash PREFIX 1 "users:" SCHEMA interests TAG expertises TAG location GEO`

We use the `FT.CREATE` command to create a full text search index named `idx:users`. We specify `ON hash` to indicate that we’re indexing the hash table, and provide `PREFIX 1 "users:"` to indicate that we should index any document whose key starts with the prefix “users:”. Finally we indicate the `SCHEMA` of the index by providing a list of fields to index, and their type.

`FT.CREATE`
`idx:users`
`ON hash`
`PREFIX 1 "users:"`
`SCHEMA`

Finally, we can query the index using the `FT.SEARCH` command (see the [query syntax reference](https://redis.io/docs/interact/search-and-query/query/)):

`FT.SEARCH`
`127.0.0.1:6379> FT.SEARCH idx:users "@interests:{dancing|piano} @expertises:{spanish|bowling} @location:[2.2948552 48.8736537 5 km]"

1. (integer) 1
2. "users:2"
3. 1. "name"
4. "Bob"
5. "expertises"
6. "french, spanish"
7. "interests"
8. "piano"
9. "location"
10. "2.2945412,48.8583206"`

In this case we’re looking for matches for Alice, so we use her expertises in the `interests` field of the query, and her interests in the `expertises` field. We also search for users in a 5km radius from her location, and we get Bob as a match.

`interests`
`expertises`

If we expand the search radius to 500km we’ll also see that Charles is returned:

`127.0.0.1:6379> FT.SEARCH idx:users "@interests:{dancing|piano} @expertises:{spanish|bowling} @location:[2.2948552 48.8736537 500 km]"

1. (integer) 2
2. "users:3"
3. 1. "name"
4. "Charles"
5. "expertises"
6. "spanish, bowling"
7. "interests"
8. "piano, dancing"
9. "location"
10. "-0.124772,51.5007169"
11. "users:2"
12. 1. "name"
13. "Bob"
14. "expertises"
15. "french, spanish"
16. "interests"
17. "piano"
18. "location"
19. "2.2945412,48.8583206"`

### Cleaning Up[#](/learn/howtos/socialnetwork#cleaning-up)

We can now remove the docker instance and move on to building the web application, running the following command from outside the instance:

`docker rm -f redis`

### Building a minimal backend in Typescript[#](/learn/howtos/socialnetwork#building-a-minimal-backend-in-typescript)

After understanding how the index works, let’s build a minimal backend API in NodeJS that will allow us to create a user, and query for matching users.

###### NOTE

This is just an example, and we’re not providing proper validation or error handling, nor other features required for the backend (e.g. authentication).

### Redis client[#](/learn/howtos/socialnetwork#redis-client)

We’ll use the [node-redis](https://www.npmjs.com/package/redis) package to create a client:

`const {
REDIS_PORT = 6379,
REDIS_HOST = 'localhost',
} = process.env;

const client: RediSearchClient = createClient({
port: Number(REDIS_PORT),
host: REDIS_HOST,
});`

All the functions in the library use callbacks, but we can use `promisify` to enable the `async/await` syntax:

`promisify`
`async/await`
`client.hgetallAsync = promisify(client.hgetall).bind(client);
client.hsetAsync = promisify(client.hset).bind(client);
client.ft_createAsync = promisify(client.ft_create).bind(client);
client.ft_searchAsync = promisify(client.ft_search).bind(client);`

Finally, let’s define a function to create the user index, as we did before in the CLI example:

`async function createUserIndex() {
 client.ft_createAsync(
 'idx:users',
 ['ON', 'hash', 'PREFIX', '1', 'users:', 'SCHEMA', 'interests', 'TAG', 'expertises', 'TAG', 'location', 'GEO']
 );
}`

### User controller[#](/learn/howtos/socialnetwork#user-controller)

Let’s define the functions that the controller will use to expose a simple API on top of Redis. We’ll define 3 functions: - `findUserById(userId)` - `createUser(user)` - `findMatchesForUser(user)`

`findUserById(userId)`
`createUser(user)`
`findMatchesForUser(user)`

But first let’s define the model we’ll use for the users:

`interface Location {
latitude: number;
longitude: number;
};

interface User {
id?: string;
name: string;
interests: string[];
expertises: string[];
location: Location
};`

Let’s start with the function to create a user from the model object:

`async function createUser(user: User): Promise<string> {
 const id = uuid();
 redisearchClient.hsetAsync(`users:${id}`, \_userToSetRequestString(user));
return id;
}

function \_userToSetRequestString(user: User): string[] {
const { id, location, interests, expertises, ...fields } = user;
let result = Object.entries(fields).flat();
result.push('interests', interests.join(', '));
result.push('expertises', expertises.join(', '));
result.push('location', `${location.longitude},${location.latitude}`);
return result;
}`

We will create a UUID for the user, and then transform the TAG and GEO fields to the redis format. Here’s an example of how these two formats look like:

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fa7e56938dc8942169f8c3e2ad3d3c92b&w=1920&q=75)

Let’s now look at the logic to retrieve an existing user from the Hash table using `HGETALL`:

`HGETALL`
`async function findUserById(userId: string): Promise<User> {
 const response = await redisearchClient.hgetallAsync(`users:${userId}`);
if (!response) {
throw new Error('User Not Found');
}
return \_userFromFlatEntriesArray(userId, Object.entries(response).flat());
}

function \_userFromFlatEntriesArray(id: string, flatEntriesArray: any[]): User {
let user: any = {};

// The flat entries array contains all keys and values as elements in an array, e.g.:
// [key1, value1, key2, value2]
for (let j = 0; j < flatEntriesArray.length; j += 2) {
let key: string = flatEntriesArray[ j ];
let value: string = flatEntriesArray[ j + 1 ];
user[ key ] = value;
}

const location: string[] = user.location.split(',');
user.location = { longitude: Number(location[ 0 ]), latitude: Number(location[ 1 ]) };
user.expertises = user.expertises.split(', ');
user.interests = user.interests.split(', ');

return {id, ...user};
}`

Here we have the inverse logic, where we want to split the TAG and GEO fields into a model object. There’s also the fact that `HGETALL` returns the field names and values in an array, and we need to build the model object from that.

`HGETALL`

Let’s finally take a look at the logic to find matches for a given user:

`async function findMatchesForUser(user: User, radiusKm: number): Promise<User[]> {
const allMatches: User[] = await \_findMatches(user.interests, user.expertises, user.location, radiusKm);
return allMatches.filter(u => u.id !== user.id);
}

async function \_findMatches(expertises: string[], interests: string[], location: Location, radiusKm: number): Promise<User[]> {
let query = `@interests:{${interests.join('|')}}`
query += ` @expertises:{${expertises.join('|')}}`
query += ` @location:[${location.longitude} ${location.latitude} ${radiusKm} km]`;

const response = await redisearchClient.ft_searchAsync('idx:users', query);

return \_usersFromSearchResponseArray(response);
}

function \_usersFromSearchResponseArray(response: any[]): User[] {
let users = [];

// The search response is an array where the first element indicates the number of results, and then
// the array contains all matches in order, one element is they key and the next is the object, e.g.:
// [2, key1, object1, key2, object2]
for (let i = 1; i <= 2 \* response[ 0 ]; i += 2) {
const user: User = \_userFromFlatEntriesArray(response[ i ].replace('users:', ''), response[ i + 1 ]);
users.push(user);
}

return users;
}`

Here we swap interests and expertises to find the complementary skill set, and we build the query that we used previously in the CLI example. we finally call the `FT.SEARCH` function, and we build the model object from the response, which comes as an array. Results are filtered to exclude the current user from the matches list.

`FT.SEARCH`

### Web API[#](/learn/howtos/socialnetwork#web-api)

Finally, we can build a trivial web API using express, exposing a `POST /users` endpoint to create a user, a `GET /users/:userId` endpoint to retrieve a user, and a `GET /users/:userId/matches` endpoint to find matches for the given user (the desired `radiusKm` can be optionally specified as a query parameter)

`POST /users`
`GET /users/:userId`
`GET /users/:userId/matches`
`radiusKm`
`app.post('/users', async (req, res) => {
const user: User = req.body;

if (!user || !user.name || !user.expertises || !user.interests || user.location.latitude === undefined || user.location.longitude === undefined) {
res.status(400).send('Missing required fields');
} else {
const userId = await userController.createUser(user);
res.status(200).send(userId);
}
});

app.get("/users/:userId", async (req, res) => {
try {
const user: User = await userController.findUserById(req.params.userId);
res.status(200).send(user);
} catch (e) {
res.status(404).send();
}
});

app.get("/users/:userId/matches", async (req, res) => {
try {
const radiusKm: number = Number(req.query.radiusKm) || 500;
const user: User = await userController.findUserById(req.params.userId);
const matches: User[] = await userController.findMatchesForUser(user, radiusKm);
res.status(200).send(matches);
} catch (e) {
console.log(e)
res.status(404).send();
}
});`

### Full code example[#](/learn/howtos/socialnetwork#full-code-example)

The code used in this blogpost can be found in the [GitHub repo](https://github.com/julianmateu/skillmarket-blogpost). The backend together with redis can be launched using docker compose:

`docker compose up -d --build`

The backend API will be exposed on port `8080`. We can see the logs with `docker compose` logs, and use a client to query it. Here’s an example using httpie:

`8080`
`docker compose`
`http :8080/users \
 name="Alice" \
 expertises:='["piano", "dancing"]' \
 interests:='["spanish", "bowling"]' \
 location:='{"longitude": 2.2948552, "latitude": 48.8736537}'

---

HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 36
Content-Type: text/html; charset=utf-8
Date: Mon, 01 Nov 2021 05:24:52 GMT
ETag: W/"24-dMinMMphAGzfWiCs49RBYnyK+r8"
Keep-Alive: timeout=5
X-Powered-By: Express
03aef405-ef37-4254-ab3c-a5ddfbc4f04e
http ":8080/users/03aef405-ef37-4254-ab3c-a5ddfbc4f04e/matches?radiusKm=15"
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 174
Content-Type: application/json; charset=utf-8
Date: Mon, 01 Nov 2021 05:26:29 GMT
ETag: W/"ae-3k2/swmuFaJd7BNHrkgvS/S+h2g"
Keep-Alive: timeout=5
X-Powered-By: Express
[
{
"expertises": [
"french",
" spanish"
],
"id": "58e81f09-d9fa-4557-9b8f-9f48a9cec328",
"interests": [
"piano"
],
"location": {
"latitude": 48.8583206,
"longitude": 2.2945412
},
"name": "Bob"
}
]`

Finally cleanup the environment:

`docker compose down --volumes --remove-orphans`

## References[#](/learn/howtos/socialnetwork#references)

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
