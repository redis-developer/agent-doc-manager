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

# Use Azure Managed Redis to store LLM chat history

![Talon Miller](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2Fb3fe7fb2314a4e7c8735074f9ae137bc)
![Roberto Perez](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2Ff9cdb89b50cb4caab925f7a307a163e7)

Learn how to deploy a Streamlit-based LLM chatbot whose history is stored in Azure Managed Redis. Setup takes just five minutes, with built-in capabilities like per-user memory, TTL, token counts, and custom system instructions.

## Features[#](/learn/howtos/use-amr-store-llm-chat-history#features)

Multiple users, each with their chat memory and settings

Running a live token count over the stored chat context

Ability to trim context to the last n messages

User-specific TTL for chat history entries

Configurable system instructions

## Architecture[#](/learn/howtos/use-amr-store-llm-chat-history#architecture)

The demo app consists of three main Azure components working together to deliver a multi-user LLM chatbot with persistent memory:

Azure App Service hosts the Streamlit web app (LLMmemory.py). When a user submits a prompt, the app’s managed identity obtains an Azure AD token and forwards the request to Azure OpenAI.

Azure OpenAI Service (GPT-4o) processes each incoming chat request. The Streamlit app sends the most recent context (based on the “Length of chat history” setting) alongside a system prompt to the OpenAI endpoint, which returns the assistant’s response.

Azure Managed Redis stores every message—user prompts, AI replies, and system instructions—as Redis hashes under keys like mysession:<UserName>:<entry_id>. The [redisvl](https://docs.redisvl.com/en/latest/) library’s StandardSessionManager abstracts reads and writes, enabling features such as per-user chat history, TTL, and token counting.

![](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2Fd7db7f297b58423cad3d0076fe979a8f?width=1038)

## Prerequisites[#](/learn/howtos/use-amr-store-llm-chat-history#prerequisites)

Azure Subscription

Azure CLI

Azure Developer CLI

### Set up[#](/learn/howtos/use-amr-store-llm-chat-history#set-up)

**Install/update Azure CLI**

brew update

brew install azure-cli

**Azure login**

az login

This should open a new browser window or tab to authenticate into your Azure account.

**Install Azure Developer CLI**

brew install azure/azure-dev/azd

If you have trouble installing the Azure Developer CLI from above, try grabbing it from here

curl -fsSL https://aka.ms/install-azd.sh | bash

**Verify the version**

azd version

You should see azd version 1.x

**Clone the demo repository and get into the folder**

git clone [[email protected]](/cdn-cgi/l/email-protection):robertopc1/Redis_LLMmemory.git

cd Redis_LLMmemory

**Azure Development CLI login**

azd auth login

If you’re not an Admin/Owner of the Azure account you’re using, then before you run the demo, make sure your Azure user has the Cognitive Services contributorrole. If you still hit errors while running azd up, being assigned the owner of the resource group unblocks most errors. If you need to troubleshoot with various permissions, resource groups, etc., remember to run azd auth logout and then azd auth login to refresh your session in your terminal after making changes in Azure.

**Run:**

azd up

Most of the time, everything stands up by itself within five minutes. And you’ll get a URL endpoint to the app in the terminal that looks something like this:

Deploying services (azd deploy)

  (✓) Done: Deploying service web

  - Endpoint: https://web-fostjta2f5eww.azurewebsites.net/

Occasionally, it may time out while creating/updating resources:

![](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F42598881bbdd488cb376738a191f0d36?width=1038)

### Feature walkthrough[#](/learn/howtos/use-amr-store-llm-chat-history#feature-walkthrough)

#### Multiple users with their separate chat memories

`1# Define users
2users = ["Luke", "Leia", "Han"]
3
4@st.cache_resource
5def initSessionManager(_redis_client):
6 session_manager = StandardSessionManager(
7 name='mysession',
8 redis_client=_redis_client
9 )
10 session_manager.clear() # Clear any existing data
11 for user in users:
12 # Preload a system message separately for each user
13 session_manager.add_message(
14 {"role": "system", "content": "You are a helpful assistant."},
15 session_tag=user
16 )
17 return session_manager
18
19# Initialize Redis client and SessionManager
20credential_provider = create_from_default_azure_credential(("https://redis.azure.com/.default",))
21redis_host = os.getenv("REDIS_HOST")
22redis_port = os.getenv("REDIS_PORT")
23redis_client = redis.Redis(
24 host=redis_host,
25 port=redis_port,
26 ssl=True,
27 credential_provider=credential_provider
28)
29session_manager = initSessionManager(redis_client)
30
31# Default Streamlit state for which user is active
32if "userselectbox" not in st.session_state:
33 st.session_state.userselectbox = "Luke"
34if "contextwindow" not in st.session_state:
35 st.session_state.contextwindow = 5
36
37# Sidebar control to switch active user
38user = st.sidebar.selectbox("Select User", users, key="userselectbox")`

#### Live token count of stored chat history

`1def calculate_tokens(text):
2 encoding = tiktoken.get_encoding("cl100k_base")
3 tokens_per_message = 3
4 tokens_per_name = 1
5 num_tokens = 0
6 for message in text:
7 num_tokens += tokens_per_message
8 for key, value in message.items():
9 num_tokens += len(encoding.encode(value))
10 if key == "name":
11 num_tokens += tokens_per_name
12 num_tokens += 3 # Add tokens for assistant priming
13 return num_tokens
14
15# Fetch the last N messages and show token count in the sidebar
16chathistory = session_manager.get_recent(
17 top_k=st.session_state.contextwindow,
18 session_tag=st.session_state.userselectbox,
19 as_text=False
20)
21tokens = st.sidebar.metric(
22 label="Chat history tokens",
23 value=calculate_tokens(chathistory)
24)
25`

#### Trim context to last _n_ messages

`1# Sidebar slider to select how many messages to keep in context
2contextwindow = st.sidebar.slider("Length of chat history", 1, 20, key="contextwindow")
3
4# When sending a new prompt:
5historylength = st.session_state.contextwindow
6# Retrieve only the last ‘historylength’ messages (skip system at index 0)
7messages = session_manager.get_recent(
8 top_k=historylength,
9 session_tag=st.session_state.userselectbox
10)[1:]
11# Pass `messages` into the LLM API call`

#### Per-user TTL (time-to-live) for chat entries

`def add_ttl(ttl_length, contextwindow, user):

# Fetch raw entries for the last `contextwindow` messages

messages = session_manager.get_recent(
top_k=contextwindow,
session_tag=user,
raw=True
)

# Set expiration on each key

for m in messages:
key_id = m["id"]
redis_client.expire(key_id, ttl_length)

# Sidebar controls for TTL

ttl_length = st.sidebar.slider("TTL time (seconds)", 1, 600, 60)
ttl_submit = st.sidebar.button("Set TTL of chat history")
if ttl_submit:
add_ttl(
ttl_length,
st.session_state.contextwindow,
st.session_state.userselectbox
)`
`1systeminstructions = [
2 "Standard ChatGPT",
3 "Extremely Brief",
4 "Obnoxious American"
5]
6
7def update_system_instructions(user, systeminstruction):
8 # Retrieve the first (system) message for this user
9 messages = session_manager.get_recent(
10 top_k=100,
11 session_tag=user,
12 raw=True
13 )
14 systemmessage = messages[0]
15 keyname = systemmessage["id"]
16
17 if systeminstruction == "Standard ChatGPT":
18 redis_client.hset(
19 keyname,
20 "content",
21 "You are a helpful assistant."
22 )
23 elif systeminstruction == "Extremely Brief":
24 redis_client.hset(
25 keyname,
26 "content",
27 "You are a VERY brief assistant. Keep your responses as short as possible."
28 )
29 elif systeminstruction == "Obnoxious American":
30 redis_client.hset(
31 keyname,
32 "content",
33 "You are a VERY pro-American assistant. "
34 "Make sure to emphasize how great the good ole’ USA is in your responses."
35 )
36
37# Sidebar dropdown to select the instruction
38st.sidebar.selectbox(
39 "System Instructions",
40 systeminstructions,
41 key="systeminstructions",
42 on_change=lambda: update_system_instructions(
43 st.session_state.userselectbox,
44 st.session_state.systeminstructions
45 ) 46)
47`

## Clean up[#](/learn/howtos/use-amr-store-llm-chat-history#clean-up)

When you’re ready to shut down the app, remember to tear down your resources:

azd down

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
