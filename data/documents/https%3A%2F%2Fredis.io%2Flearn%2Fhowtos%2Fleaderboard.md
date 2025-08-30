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

# How to build a Real-Time Leaderboard app Using Redis

![Ajeet Raina](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F241cb4ece2bb4c0fb6df75c4495182cd)

The concept of a leaderboard—a scoreboard showing the ranked names and current scores (or other data points) of the leading competitors—is essential to the world of computer gaming, but leaderboards are now about more than just games. They are about gamification, a broader implementation that can include any group of people with a common goal (coworkers, students, sales groups, fitness groups, volunteers, and so on).

Leaderboards can encourage healthy competition in a group by openly displaying the current ranking of each group member. They also provide a clear way to view the ongoing achievements of the entire team as members move towards a goal. Gamification of tasks and goals via leaderboards is a great way to motivate people by providing them with constant feedback of where they rank in comparison to other group members. Done well, this can lead to healthy competition that builds group cohesion.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Ff46f4fb04fd149ef8bbbbb1f0e5f3bd1&w=1920&q=75)

## Step 1. Install the below software[#](/learn/howtos/leaderboard#step-1-install-the-below-software)

## Step 2. Clone the repository[#](/learn/howtos/leaderboard#step-2-clone-the-repository)

`git clone https://github.com/redis-developer/basic-redis-leaderboard-demo-java`

## Step 3. Run docker compose[#](/learn/howtos/leaderboard#step-3-run-docker-compose)

`docker network create global
docker-compose up -d --build`

## Step 4. Verifying if containers are up and running[#](/learn/howtos/leaderboard#step-4-verifying-if-containers-are-up-and-running)

`docker-compose ps
Name Command State Ports

---

redis.redisleaderboard.docker docker-entrypoint.sh redis ... Up 127.0.0.1:55000->6379/tcp`

## Step 5. Copy .env.example to create .env[#](/learn/howtos/leaderboard#step-5-copy-envexample-to-create-env)

Provide the values for environment variables (if needed)

`- REDIS_URL: Redis database endpoint URL

- REDIS_HOST: Redis server host
- REDIS_PORT: Redis server port
- REDIS_DB: Redis server db index
- REDIS_PASSWORD: Redis server password`

If you're using Redis Cloud, you must supply DB endpoint, password, port and the name of the database. In case of local system, the entries look like as shown below:

`REDIS_URL=
REDIS_HOST=redis://localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=`

## Step 6. Run the backend[#](/learn/howtos/leaderboard#step-6-run-the-backend)

Follow the following link <https://gradle.org/install/> for your MacOS

`brew install gradle`

Follow the following link <https://docs.oracle.com/javase/10/install/installation-jdk-and-jre-macos.htm> for your MacOS

`export $(cat .env | xargs)`

## Step 7. Run the wrapper task[#](/learn/howtos/leaderboard#step-7-run-the-wrapper-task)

To use Wrapper, we need to generate some particular files. We'll generate these files using the built-in Gradle task called wrapper. Note that we need to generate these files only once.

Now, let's run the wrapper task in our project directory:

`gradle wrapper`

It should show the below results:

`Welcome to Gradle 6.8.3!

Here are the highlights of this release:

- Faster Kotlin DSL script compilation
- Vendor selection for Java toolchains
- Convenient execution of tasks in composite builds
- Consistent dependency resolution
  For more details see https://docs.gradle.org/6.8.3/release-notes.html
  Starting a Gradle Daemon (subsequent builds will be faster)

BUILD SUCCESSFUL in 29s
1 actionable task: 1 executed`

## Step 8. Perform the build task[#](/learn/howtos/leaderboard#step-8-perform-the-build-task)

The Gradle Wrapper is now available for building your project. It's time to run the wrapper script to perform the build task.

`./gradlew build
% ./gradlew build
Downloading https://services.gradle.org/distributions/gradle-6.8.3-bin.zip
..........10%..........20%..........30%...........40%..........50%..........60%..........70%...........80%..........90%..........100%
Starting a Gradle Daemon, 1 incompatible Daemon could not be reused, use --status for details

> Task :test
> 2021-03-01 07:08:42.962 INFO 3624 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor : Shutting down ExecutorService 'applicationTaskExecutor'

BUILD SUCCESSFUL in 1m 13s
12 actionable tasks: 12 executed`

## Step 9. Run your application[#](/learn/howtos/leaderboard#step-9-run-your-application)

`./gradlew run`
`> Task :run
 . ____ _ __ _ _
 /\\ / ___'_ __ _ _(_)_ __ __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/ **_)| |_)| | | | | || (\_| | ) ) ) )
' |\_\_**| .**|_| |_|_| |_\__, | / / / /
=========|_|==============|\_**/=/_/_/\_/
:: Spring Boot :: (v2.4.1)
2021-03-01 07:09:59.610 INFO 3672 --- [ restartedMain] BasicRedisLeaderLoardDemoJavaApplication : Starting BasicRedisLeaderLoardDemoJavaApplication using Java 13.0.2 on Ajeets-MacBook-Pro.local with PID 3672 (/Users/ajeetraina/projects/basic-redis-leaderboard-demo-java/build/classes/java/main started by ajeetraina in /Users/ajeetraina/projects/basic-redis-leaderboard-demo-java)
2021-03-01 07:09:59.614 INFO 3672 --- [ restartedMain] BasicRedisLeaderLoardDemoJavaApplication : No active profile set, falling back to default profiles: default
2021-03-01 07:09:59.661 INFO 3672 --- [ restartedMain] .e.DevToolsPropertyDefaultsPostProcessor : Devtools property defaults active! Set 'spring.devtools.add-properties' to 'false' to disable
2021-03-01 07:09:59.661 INFO 3672 --- [ restartedMain] .e.DevToolsPropertyDefaultsPostProcessor : For additional web related logging consider setting the 'logging.level.web' property to 'DEBUG'
2021-03-01 07:10:00.481 INFO 3672 --- [ restartedMain] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat initialized with port(s): 5000 (http)
2021-03-01 07:10:00.492 INFO 3672 --- [ restartedMain] o.apache.catalina.core.StandardService : Starting service [Tomcat]
2021-03-01 07:10:00.492 INFO 3672 --- [ restartedMain] org.apache.catalina.core.StandardEngine : Starting Servlet engine: [Apache Tomcat/9.0.41]
2021-03-01 07:10:00.551 INFO 3672 --- [ restartedMain] o.a.c.c.C.[Tomcat].[localhost].[/] : Initializing Spring embedded WebApplicationContext
2021-03-01 07:10:00.551 INFO 3672 --- [ restartedMain] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 889 ms
2021-03-01 07:10:00.756 INFO 3672 --- [ restartedMain] o.s.s.concurrent.ThreadPoolTaskExecutor : Initializing ExecutorService 'applicationTaskExecutor'
2021-03-01 07:10:00.845 INFO 3672 --- [ restartedMain] o.s.b.a.w.s.WelcomePageHandlerMapping : Adding welcome page: URL [file:/Users/ajeetraina/projects/basic-redis-leaderboard-demo-java/assets/index.html]
2021-03-01 07:10:00.949 INFO 3672 --- [ restartedMain] .s.s.UserDetailsServiceAutoConfiguration :
Using generated security password: ea2d5326-b04c-4f93-b771-57bcb53f656e
2021-03-01 07:10:01.016 INFO 3672 --- [ restartedMain] o.s.s.web.DefaultSecurityFilterChain : Will secure any request with [org.springframework.security.web.context.request.async.WebAsyncManagerIntegrationFilter@583fa06c, org.springframework.security.web.context.SecurityContextPersistenceFilter@524c0386, org.springframework.security.web.header.HeaderWriterFilter@c6e5d4e, org.springframework.security.web.authentication.logout.LogoutFilter@3e1f33e9, org.springframework.security.web.savedrequest.RequestCacheAwareFilter@6790427f, org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter@40ddf86, org.springframework.security.web.authentication.AnonymousAuthenticationFilter@1412ffa9, org.springframework.security.web.session.SessionManagementFilter@3eb6c20f, org.springframework.security.web.access.ExceptionTranslationFilter@21646e94, org.springframework.security.web.access.intercept.FilterSecurityInterceptor@649e1b25]
2021-03-01 07:10:01.043 INFO 3672 --- [ restartedMain] o.s.b.d.a.OptionalLiveReloadServer : LiveReload server is running on port 35729
2021-03-01 07:10:01.065 INFO 3672 --- [ restartedMain] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port(s): 5000 (http) with context path ''
2021-03-01 07:10:01.093 INFO 3672 --- [ restartedMain] BasicRedisLeaderLoardDemoJavaApplication : Started BasicRedisLeaderLoardDemoJavaApplication in 1.937 seconds (JVM running for 2.327)
<=========----> 75% EXECUTING [17s]

> :run`

## Step 10. Access the leaderboard application[#](/learn/howtos/leaderboard#step-10-access-the-leaderboard-application)

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Ff46f4fb04fd149ef8bbbbb1f0e5f3bd1&w=1920&q=75)

## How it works?[#](/learn/howtos/leaderboard#how-it-works)

### How the data is stored:[#](/learn/howtos/leaderboard#how-the-data-is-stored)

The AAPL's details - market cap of 2.6 triillions and USA origin - are stored in a hash like below:

`HSET "company:AAPL" symbol "AAPL" market_cap "2600000000000" country USA`

The Ranks of AAPL of 2.6 trillions are stored in a ZSET.

`ZADD companyLeaderboard 2600000000000 company:AAPL`

### How the data is accessed:[#](/learn/howtos/leaderboard#how-the-data-is-accessed)

Top 10 companies:

`ZREVRANGE companyLeaderboard 0 9 WITHSCORES`

All companies:

`ZREVRANGE companyLeaderboard 0 -1 WITHSCORES`

Bottom 10 companies:

`ZRANGE companyLeaderboard 0 9 WITHSCORES`

Between rank 10 and 15:

`ZREVRANGE companyLeaderboard 9 14 WITHSCORES`

Show ranks of AAPL, FB and TSLA:

`ZREVRANGE companyLeaderBoard company:AAPL company:FB company:TSLA`

Adding 1 billion to market cap of FB company:

`ZINCRBY companyLeaderBoard 1000000000 "company:FB"`

Reducing 1 billion of market cap of FB company:

`ZINCRBY companyLeaderBoard -1000000000 "company:FB"`

Companies between 500 billion and 1 trillion:

`ZCOUNT companyLeaderBoard 500000000000 1000000000000`

Companies over a Trillion:

`ZCOUNT companyLeaderBoard 1000000000000 +inf`

#### Join Redis University

#### Get Started with Redis

This path is designed for developers who are new to Redis. Whether you’re ready to start using Redis in production or just interested in learning...

## References[#](/learn/howtos/leaderboard#references)

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
