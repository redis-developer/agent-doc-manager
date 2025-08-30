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

# How to build a Fraud Detection System using Redis

![Ajeet Raina](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F241cb4ece2bb4c0fb6df75c4495182cd)
![Sachin Kottarathodi](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F8eff3e11f24c46c8af4bed2ba8dd1a37)

Imagine that your ads are generating a lot of traffic, but you are not seeing the desired results from your ad spend. This might not be a coincidence—fraudsters often try to steal digital ad marketing budgets through various sophisticated mechanisms. Faking clicks can make it appear as though a real user was engaging with the ad, but in reality when these fake clicks drive installs, the cost of the install goes to the fraudster’s pocket. As companies’ willingness to spend more on digital advertisements grows, the number of fraudsters in ad markets also increases.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F6bcb36cb94854137ace33f0cc4c88286&w=1920&q=75)

This blog post will demonstrate a simplified use case of how real-time fraud detection works—so that you can understand how to stay ahead of the fraudsters.

Here’s what we have used:

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fd70abd61986e483a832434e99af8da91&w=1920&q=75)

## Step #1: Installing Docker[#](/learn/howtos/frauddetection#step-1-installing-docker)

You can follow <https://docs.docker.com/get-docker/> to get Docker installed on your local system.

## Step #2: Get Ready to Redis[#](/learn/howtos/frauddetection#step-2-get-ready-to-redis)

You will need a Redis server up and running on your local machine. You can use the below CLI to bring up Redis server with RedisGears.

`$ docker run -d -p 6379:6379 redislabs/redismod`

The command will pull the image from redis docker repo and start the Redis server with all the required modules and the logs ends like this.

## Step #3: Cloning the Repository[#](/learn/howtos/frauddetection#step-3-cloning-the-repository)

`$ git clone https://github.com/redis-developer/redis-datasets.git`

## Step #4: Building and Running the Docker Container[#](/learn/howtos/frauddetection#step-4-building-and-running-the-docker-container)

Change directory to fraud-detection

`$ cd redis-datasets/use-cases/fraud-detection`

The code is present in use-cases/fraud-detection. The app is dockerized with necessary packages (including client packages for redis modules).

Create the image using the command:

`$ docker build -t redis-fraud:latest .`

Create the container using the command:

`$ docker run -e REDIS_HOST='<host>' -e REDIS_PORT=6379 -p 5000:5000 -d redis-fraud`

You will get the container Id, which can be used to tail application logs.

`$ docker logs -f <container-id>`

If you are using a redismod image to run Redis locally, please provide the IP of the host machine (and not localhost or 127.0.0.1).

## Step #5: Verifying the Application[#](/learn/howtos/frauddetection#step-5-verifying-the-application)

Let's take a look at how connections are managed in this project.

`import os
import redis
from redisbloom.client import Client
from singleton_decorator import singleton

@singleton
class RedisConn:
def **init**(self):
host = os.getenv("REDIS_HOST")
port = os.getenv("REDIS_PORT")

if not host or not port:
raise Exception("No Redis Host or Port provided. Please provide Host and Port in docker run command as env")

port = int(port)
self.redis_client = redis.Redis(host=host, port=port)
self.bloom_client = Client(host=host, port=port)

def redis(self):
return self.redis_client
def bloom(self):
return self.bloom_client`

In line 2, we import the redis package for package. All the core Redis commands are available in this Redis package.

In line 4, we import the RedisBloom package. Since RedisBloom is a module, the clients used to interact with this module are also different. We will see more such examples below. The singleton_decorator ensures only one instance of this connection class is created, and os package is used to read the environment variables to form the connection.

Now let’s take a look at how we use Redis to solve click spamming and IP fraud.

Gist: <https://gist.github.com/Sachin-Kottarathodi/c3a0647d3fdd0fe8a76425e0594e11c5>

`def ip_fraud(self, data):
 exists = RedisConn().bloom().cfExists(Constants.IP_CUCKOO_FILTER_NAME, data['ip'])
 if exists:
 data['fraud_type'] = Constants.IP_BLACKLIST
 data['status'] = Constants.FRAUD
 return exists
 def click_spam(self, data):
 is_click_spammed = False
 count = RedisConn().redis().zcount(data.get('device_id'), data['ts'] - self.click_spam_window_in_sec, data['ts'])
 if count >= self.click_spam_threshold:
 is_click_spammed = True
 data['fraud_type'] = Constants.CLICK_SPAM
 data['status'] = Constants.FRAUD
 return is_click_spammed
 def publish(self, data):
 RedisConn().redis().xadd(Constants.STREAM_NAME, data, id='*')`

In the above code, Cuckoo Filter is used to find blacklisted IP fraud. Cuckoo Filter is a probabilistic data structure that’s part of Redis Stack. Checking for existence of IP in Cuckoo Filter is done using the cfExists method provided by bloom client.

###### TIP

The Cuckoo Filter can return false positives. To configure the error rate, the `cf.reserve` command can be used to create the filter, and a custom bucket size can be provided.

`cf.reserve`

To identify click spam, we use the zcount method of sorted sets provided in redis package. Using zcount, we find the number of clicks from a device in a certain pre configured window. If the count received is greater than a certain threshold, we identify it as anomalous.

Finally, data is pushed to Redistream using the xadd command. id=’\*’ indicates Redistream to generate a unique id for our message.

### Registering Gears:[#](/learn/howtos/frauddetection#registering-gears)

When the app appears, a gear is registered, which reacts to the stream that we use to push data.

Gist:<https://gist.github.com/Sachin-Kottarathodi/f9dac7a3342a3643e792e2143a6adf7d>

`from gearsclient import GearsRemoteBuilder as GearsBuilder
from redistimeseries.client import Client
def stream_handler(item):
data = item['value']
member = json.dumps(
{'device_id': data['device_id'],
'transaction_id': data['transaction_id'],
'ts': data['ts'],
})
redis.Redis().zadd(data.get('device_id'), {member: data['ts']})
Client().incrby(data['fraud_type'], 1)

GearsBuilder(reader='StreamReader', r=redis_conn, requirements=["redis", "redistimeseries"]).foreach(stream_handler).register('data_stream')`

As mentioned before, since RedisGears and Redis Time Series are modules, we need to use the clients provided in their respective packages.

We use the GearsRemoteBuilder class to build the Gear. StreamReader ensures that the stream_handler function is executed for every new message from the stream. The stream_handler adds the data to the sorted set using zadd (This information is used in zcount to identify click_spam) and increments the count of time series for clean and fraud types using incrby of the Redis Time Series module, which is later used for visualization.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F2267f4d104c041119174ee27433108d4&w=1920&q=75)

Gear registration can be checked on RedisInsight as well.

Finally, we incorporate the flask app which exposes the end point for trigger.

Gist: <https://gist.github.com/Sachin-Kottarathodi/2a6cccb29b4a9fdc7d58086af07aa6eb>

`from flask import Flask, request
from fraud_checks import FraudChecks
from setup import Setup
app = Flask(**name**)

@app.route('/', methods=['POST'])
def check_fraud():
try:
response = FraudChecks().check_fraud(request.get_json())
code = 200
except Exception as e:
print("Error occurred ", e)
response = str(e)
code = 500

return response, code

if **name** == '**main**':
Setup().init()
app.run(port=5000, debug=False, host='0.0.0.0')`

Here, the app is exposed on port 5000. Before starting the server, our init method of setup is called to register the gear.The endpoint calls the function that does the fraud checks and returns the response.

The application is written in python and exposes an endpoint which accepts a few parameters. Use the below command to invoke the application:

`$ curl --request POST 'localhost:5000' --header 'Content-Type: application/json' --data-raw '{
 "device_id": "111-000-000",
 "ip": "1.1.1.1",
 "transaction_id": "3e4fad5fs"}'
 clean`

Since initially no data is available in Cuckoo Filter, all IPs will be allowed through. To add data to Cuckoo Filter, connect to Redis using cli and run the command

`cf.addnx ip_cf 1.1.1.1`

Run the post command with this IP again. This time, the result will be ip_blacklist.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Faad4b84d72314436b25c9325f4f5aee0&w=1920&q=75)

## Click Spamming:[#](/learn/howtos/frauddetection#click-spamming)

The app is configured to allow two events in a window of 10 seconds from the same device. To verify, make more than two curl requests within 10 seconds and the result will be `click_spam`.

`click_spam`
![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F41f4f66a31cd45c6ad17844209f4989b&w=1920&q=75)

Optional: The following variables can be configured during the ‘docker run’ command. -e CLICK_SPAM_THRESHOLD=3 -e CLICK_SPAM_WINDOW_IN_SEC=10

## Step #6: Deploy Grafana[#](/learn/howtos/frauddetection#step-6-deploy-grafana)

It’s exciting to see the fraud detection plotted in Grafana. To implement this, run the command below:

`$ docker run -d -e "GF_INSTALL_PLUGINS=redis-app" -p 3000:3000 grafana/grafana`

Point your browser to https://<IP_ADDRESS>:3000.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F71e09eea00ac45aca40b338abb9d5c32&w=1080&q=75)

Login as ‘admin’ with password as ‘admin’, you can reset the password after your first login.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F511f9bb5f29f4195ac4f1276814d09b6&w=1920&q=75)

Click on the gear icon on the left panel (Configuration) and choose Data Sources.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F119bfa8631a54ea8984a604c469f60c6&w=1920&q=75)

Choose ‘Add data source’.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F1743b74e576545879817e4c40a9c4643&w=1200&q=75)

Search for Redis and choose Redis Data Source.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F850d1d2c6161428c87bf800bb40f18b7&w=1920&q=75)

Copy and paste the raw json content from [here](https://github.com/redis-developer/redis-datasets/blob/master/use-cases/fraud-detection/Fraud-Stats-Grafana.json) in the ‘Import via panel json’ box. Click on Load.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F901efb177f154bcfb78434b4ca68fd5a&w=1920&q=75)

This creates a dashboard ‘Fraud Stats’. If you get an error while importing the dashboard, try changing the name and UUID of the dashboard.

![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252F8c50aec00ff94305a989e7647320de73&w=1920&q=75)
![](/learn/_next/image?url=https%3A%2F%2Fcdn.builder.io%2Fapi%2Fv1%2Fimage%2Fassets%252Fbf70e6aa643f4e8db14c5b0c8dbba962%252Fbc5c79d1c54e462db4c5b29f3441ce10&w=1920&q=75)

## Conclusion & future work[#](/learn/howtos/frauddetection#conclusion--future-work)

## References and Links[#](/learn/howtos/frauddetection#references-and-links)

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
