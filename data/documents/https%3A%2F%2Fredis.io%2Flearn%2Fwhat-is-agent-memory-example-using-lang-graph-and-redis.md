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

# What is Agent Memory? Example using LangGraph and Redis

[This notebook](https://github.com/redis-developer/redis-ai-resources/blob/main/python-recipes/agents/03_memory_agent.ipynb) demonstrates how to manage short-term and long-term agent memory using LangGraph and Redis. We'll explore:

## What we'll build[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#what-well-build)

We're going to build two versions of a travel agent, one that manages long-term memory manually and one that does so using tools the LLM calls.

Here are two diagrams showing the components used in both agents:

![](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2Fd5e7c4625ac44c5abf65305532460406?width=1662)

## Setup[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#setup)

`pip install -q langchain-openai langgraph-checkpoint langgraph-checkpoint-redis "langchain-community>=0.2.11" tavily-python langchain-redis pydantic ulid`

### Required API keys[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#required-api-keys)

You must add an OpenAI API key with billing information for this lesson. You will also need a Tavily API key. Tavily API keys come with free credits at the time of this writing.

`# NBVAL_SKIP
import getpass
import os
def \_set_env(key: str):
if key not in os.environ:
os.environ[key] = getpass.getpass(f"{key}:")

\_set_env("OPENAI_API_KEY")

# Uncomment this if you have a Tavily API key and want to

# use the web search tool.

# \_set_env("TAVILY_API_KEY")`

### Run Redis[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#run-redis)

### For Colab[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#for-colab)

Convert the following cell to Python to run it in Colab.

`# Exit if this is not running in Colab
if [ -z "$COLAB_RELEASE_TAG" ]; then
exit 0
fi

curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update > /dev/null 2>&1
sudo apt-get install redis-stack-server > /dev/null 2>&1
redis-stack-server --daemonize yes`

### For alternative environments[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#for-alternative-environments)

There are many ways to get the necessary redis-stack instance running

With docker: `docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest`

`docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest`

### Test connection to Redis[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#test-connection-to-redis)

`import os
from redis import Redis

# Use the environment variable if set, otherwise default to localhost

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client = Redis.from_url(REDIS_URL)
redis_client.ping()`

## Short-term vs. long-term memory[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#shortterm-vs-longterm-memory)

The agent uses **short-term memory** and **long-term memory**. The implementations of short-term and long-term memory differ, as does how the agent uses them. Let's dig into the details. We'll return to code soon.

### **Short-term memory**

For short-term memory, the agent keeps track of conversation history with Redis. Because this is a LangGraph agent, we use the RedisSaver class to achieve this. RedisSaver is what LangGraph refers to as a . You can read more about checkpointers in the [LangGraph documentation](https://langchain-ai.github.io/langgraph/concepts/persistence/). In short, they store state for each node in the graph, which for this agent includes conversation history.

Here's a diagram showing how the agent uses Redis for short-term memory. Each node in the graph (Retrieve Users, Respond, Summarize Conversation) persists its "state" to Redis. The state object contains the agent's message conversation history for the current thread.

![](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F4aa8d461a539480793fdd67180d6b2d4?width=1662)

If Redis persistence is on, then Redis will persist short-term memory to disk. This means if you quit the agent and return with the same thread ID and user ID, you'll resume the same conversation.

Conversation histories can grow long and pollute an LLM's context window. To manage this, after every "turn" of a conversation, the agent summarizes messages when the conversation grows past a configurable threshold. Checkpointers do not do this by default, so we've created a node in the graph for summarization.

**NOTE**: We'll see example code for the summarization node later in this notebook.

### **Long-term memory**

Aside from conversation history, the agent stores long-term memories in a search index in Redis, using [RedisVL](https://docs.redisvl.com/en/latest/). Here's a diagram showing the components involved:

![](https://cdn.builder.io/api/v1/image/assets%2Fbf70e6aa643f4e8db14c5b0c8dbba962%2F2fa46d60673447dbb8191e14d49b8f4d?width=1662)

The agent tracks two types of long-term memories:

**NOTE** If you're familiar with the [CoALA paper](https://arxiv.org/abs/2309.02427), the terms "episodic" and "semantic" here map to the same concepts in the paper. CoALA discusses a third type of memory, . In our example, we consider logic encoded in Python in the agent codebase to be its procedural memory.

### **Representing long-term memory in python**

We use a couple of Pydantic models to represent long-term memories, both before and after they're stored in Redis:

`from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
import ulid
class MemoryType(str, Enum):
"""
The type of a long-term memory.
EPISODIC: User specific experiences and preferences
SEMANTIC: General knowledge on top of the user's preferences and LLM's
training data.
"""

EPISODIC = "episodic"
SEMANTIC = "semantic"

class Memory(BaseModel):
"""Represents a single long-term memory."""

content: str
memory_type: MemoryType
metadata: str

class Memories(BaseModel):
"""
A list of memories extracted from a conversation by an LLM.
NOTE: OpenAI's structured output requires us to wrap the list in an object.
"""
memories: List[Memory]

class StoredMemory(Memory):
"""A stored long-term memory"""

id: str # The redis key
memory_id: ulid.ULID = Field(default_factory=lambda: ulid.ULID())
created_at: datetime = Field(default_factory=datetime.now)
user_id: Optional[str] = None
thread_id: Optional[str] = None
memory_type: Optional[MemoryType] = None

class MemoryStrategy(str, Enum):
"""
Supported strategies for managing long-term memory.
This notebook supports two strategies for working with long-term memory:
TOOLS: The LLM decides when to store and retrieve long-term memories, using
tools (AKA, function-calling) to do so.
MANUAL: The agent manually retrieves long-term memories relevant to the
current conversation before sending every message and analyzes every
response to extract memories to store.
NOTE: In both cases, the agent runs a background thread to consolidate
memories, and a workflow step to summarize conversations after the history
grows past a threshold.
"""

TOOLS = "tools"
MANUAL = "manual"

# By default, we'll use the manual strategy

memory_strategy = MemoryStrategy.MANUAL`

We'll return to these models soon to see them in action.

### Short-term memory storage and retrieval[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#shortterm-memory-storage-and-retrieval)

The `RedisSaver` class handles the basics of short-term memory storage for us, so we don't need to do anything here.

`RedisSaver`

### Long-term memory storage and retrieval[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#longterm-memory-storage-and-retrieval)

We use RedisVL to store and retrieve long-term memories with vector embeddings. This allows for semantic search of past experiences and knowledge.

Let's set up a new search index to store and query memories:

`from redisvl.index import SearchIndex
from redisvl.schema.schema import IndexSchema

# Define schema for long-term memory index

memory_schema = IndexSchema.from_dict({
"index": {
"name": "agent_memories",
"prefix": "memory:",
"key_separator": ":",
"storage_type": "json",
},
"fields": [
{"name": "content", "type": "text"},
{"name": "memory_type", "type": "tag"},
{"name": "metadata", "type": "text"},
{"name": "created_at", "type": "text"},
{"name": "user_id", "type": "tag"},
{"name": "memory_id", "type": "tag"},
{
"name": "embedding",
"type": "vector",
"attrs": {
"algorithm": "flat",
"dims": 1536, # OpenAI embedding dimension
"distance_metric": "cosine",
"datatype": "float32",
},
},
],
}
)

# Create search index

try:
long_term_memory_index = SearchIndex(
schema=memory_schema, redis_client=redis_client, overwrite=True
)
long_term_memory_index.create()
print("Long-term memory index ready")
except Exception as e:
print(f"Error creating index: {e}")`

### **Storage and retrieval functions**

Now that we have a search index in Redis, we can write functions to store and retrieve memories. We can use RedisVL to write these.

First, we'll write a utility function to check if a memory similar to a given memory already exists in the index. Later, we can use this to avoid storing duplicate memories.

#### **Checking for similar memories**

`import logging
from redisvl.query import VectorRangeQuery
from redisvl.query.filter import Tag
from redisvl.utils.vectorize.text.openai import OpenAITextVectorizer

logger = logging.getLogger(**name**)

# If we have any memories that aren't associated with a user, we'll use this ID.

SYSTEM_USER_ID = "system"

openai_embed = OpenAITextVectorizer(model="text-embedding-ada-002")

# Change this to MemoryStrategy.TOOLS to use function-calling to store and

# retrieve memories.

memory_strategy = MemoryStrategy.MANUAL

def similar_memory_exists(
content: str,
memory_type: MemoryType,
user_id: str = SYSTEM_USER_ID,
thread_id: Optional[str] = None,
distance_threshold: float = 0.1,
) -> bool:
"""Check if a similar long-term memory already exists in Redis."""
query_embedding = openai_embed.embed(content)
filters = (Tag("user_id") == user_id) & (Tag("memory_type") == memory_type)
if thread_id:
filters = filters & (Tag("thread_id") == thread_id)

# Search for similar memories

vector_query = VectorRangeQuery(
vector=query_embedding,
num_results=1,
vector_field_name="embedding",
filter_expression=filters,
distance_threshold=distance_threshold,
return_fields=["id"],
)
results = long_term_memory_index.query(vector_query)
logger.debug(f"Similar memory search results: {results}")

if results:
logger.debug(
f"{len(results)} similar {'memory' if results.count == 1 else 'memories'} found. First: "
f"{results[0]['id']}. Skipping storage."
)
return True

return False`

#### **Storing and retrieving long-term memories**

We'll use the `similar_memory_exists()` function when we store memories:

`similar_memory_exists()`
`from datetime import datetime
from typing import List, Optional, Union
import ulid

def store_memory(
content: str,
memory_type: MemoryType,
user_id: str = SYSTEM_USER_ID,
thread_id: Optional[str] = None,
metadata: Optional[str] = None,
):
"""Store a long-term memory in Redis, avoiding duplicates."""
if metadata is None:
metadata = "{}"

logger.info(f"Preparing to store memory: {content}")

if similar_memory_exists(content, memory_type, user_id, thread_id):
logger.info("Similar memory found, skipping storage")
return

embedding = openai_embed.embed(content)

memory_data = {
"user_id": user_id or SYSTEM_USER_ID,
"content": content,
"memory_type": memory_type.value,
"metadata": metadata,
"created_at": datetime.now().isoformat(),
"embedding": embedding,
"memory_id": str(ulid.ULID()),
"thread_id": thread_id,
}

try:
long_term_memory_index.load([memory_data])
except Exception as e:
logger.error(f"Error storing memory: {e}")
return

logger.info(f"Stored {memory_type} memory: {content}")`

And now that we're storing memories, we can retrieve them:

`def retrieve_memories(
query: str,
memory_type: Union[Optional[MemoryType], List[MemoryType]] = None,
user_id: str = SYSTEM_USER_ID,
thread_id: Optional[str] = None,
distance_threshold: float = 0.1,
limit: int = 5,
) -> List[StoredMemory]:
"""Retrieve relevant memories from Redis"""

# Create vector query

logger.debug(f"Retrieving memories for query: {query}")
vector_query = VectorRangeQuery(
vector=openai_embed.embed(query),
return_fields=[
"content",
"memory_type",
"metadata",
"created_at",
"memory_id",
"thread_id",
"user_id",
],
num_results=limit,
vector_field_name="embedding",
dialect=2,
distance_threshold=distance_threshold,
)

base_filters = [f"@user_id:{{{user_id or SYSTEM_USER_ID}}}"]

if memory_type:
if isinstance(memory_type, list):
base_filters.append(f"@memory_type:{{{'|'.join(memory_type)}}}")
else:
base_filters.append(f"@memory_type:{{{memory_type.value}}}")

if thread_id:
base_filters.append(f"@thread_id:{{{thread_id}}}")

vector_query.set_filter(" ".join(base_filters))

# Execute search

results = long_term_memory_index.query(vector_query)

# Parse results

memories = []
for doc in results:
try:
memory = StoredMemory(
id=doc["id"],
memory_id=doc["memory_id"],
user_id=doc["user_id"],
thread_id=doc.get("thread_id", None),
memory_type=MemoryType(doc["memory_type"]),
content=doc["content"],
created_at=doc["created_at"],
metadata=doc["metadata"],
)
memories.append(memory)
except Exception as e:
logger.error(f"Error parsing memory: {e}")
continue
return memories`

### Managing long-term memory manually vs. calling tools[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#managing-longterm-memory-manually-vs-calling-tools)

While making LLM queries, agents can store and retrieve relevant long-term memories in one of two ways (and more, but these are the two we'll discuss):

These approaches both have tradeoffs.

**Tool-calling** leaves the decision to store a memory or find relevant memories up to the LLM. This can add latency to requests. It will generally result in fewer calls to Redis but will also sometimes miss out on retrieving potentially relevant context and/or extracting relevant memories from a conversation.

**Manual memory management** will result in more calls to Redis but will produce fewer round-trip LLM requests, reducing latency. Manually extracting memories will generally extract more memories than tool calls, which will store more data in Redis and should result in more context added to LLM requests. More context means more contextual awareness but also higher token spend.

You can test both approaches with this agent by changing the `memory_strategy` variable.

`memory_strategy`

### Managing memory manually[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#managing-memory-manually)

With the manual memory management strategy, we're going to extract memories after every interaction between the user and the agent. We're then going to retrieve those memories during future interactions before we send the query.

### **Extracting memories**

We'll call this `extract_memories` function manually after each interaction:

`extract_memories`
`from langchain_core.messages import HumanMessage
from langchain_core.runnables.config import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph.message import MessagesState
class RuntimeState(MessagesState):
"""Agent state (just messages for now)"""

pass

memory_llm = ChatOpenAI(model="gpt-4o", temperature=0.3).with_structured_output(
Memories
)

def extract_memories(
last_processed_message_id: Optional[str],
state: RuntimeState,
config: RunnableConfig,
) -> Optional[str]:
"""Extract and store memories in long-term memory"""
logger.debug(f"Last message ID is: {last_processed_message_id}")

if len(state["messages"]) < 3: # Need at least a user message and agent response
logger.debug("Not enough messages to extract memories")
return last_processed_message_id
user_id = config.get("configurable", {}).get("user_id", None)
if not user_id:
logger.warning("No user ID found in config when extracting memories")
return last_processed_message_id

# Get the messages

messages = state["messages"]

# Find the newest message ID (or None if no IDs)

newest_message_id = None
for msg in reversed(messages):
if hasattr(msg, "id") and msg.id:
newest_message_id = msg.id
break

logger.debug(f"Newest message ID is: {newest_message_id}")

# If we've already processed up to this message ID, skip

if (
last_processed_message_id
and newest_message_id
and last_processed_message_id == newest_message_id
):
logger.debug(f"Already processed messages up to ID {newest_message_id}")
return last_processed_message_id

# Find the index of the message with last_processed_message_id

start_index = 0
if last_processed_message_id:
for i, msg in enumerate(messages):
if hasattr(msg, "id") and msg.id == last_processed_message_id:
start_index = i + 1 # Start processing from the next message
break

# Check if there are messages to process

if start_index >= len(messages):
logger.debug("No new messages to process since last processed message")
return newest_message_id

# Get only the messages after the last processed message

messages_to_process = messages[start_index:]

# If there are not enough messages to process, include some context

if len(messages_to_process) < 3 and start_index > 0:

# Include up to 3 messages before the start_index for context

context_start = max(0, start_index - 3)
messages_to_process = messages[context_start:]

# Format messages for the memory agent

message_history = "\n".join(
[
f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg.content}"
for msg in messages_to_process
]
)

prompt = f"""
You are a long-memory manager. Your job is to analyze this message history
and extract information that might be useful in future conversations.
Extract two types of memories:

1.  EPISODIC: Personal experiences and preferences specific to this user
    Example: "User prefers window seats" or "User had a bad experience in Paris"
2.  SEMANTIC: General facts and knowledge about travel that could be useful
    Example: "The best time to visit Japan is during cherry blossom season in April"
    For each memory, provide:

- Type: The memory type (EPISODIC/SEMANTIC)
- Content: The actual information to store
- Metadata: Relevant tags and context (as JSON)
  IMPORTANT RULES:

1.  Only extract information that would be genuinely useful for future interactions.
2.  Do not extract procedural knowledge - that is handled by the system's built-in tools and prompts.
3.  You are a large language model, not a human - do not extract facts that you already know.
    Message history:
    {message_history}

Extracted memories:
"""

memories_to_store: Memories = memory_llm.invoke([HumanMessage(content=prompt)]) # type: ignore

# Store each extracted memory

for memory_data in memories_to_store.memories:
store_memory(
content=memory_data.content,
memory_type=memory_data.memory_type,
user_id=user_id,
metadata=memory_data.metadata,
)

# Return data with the newest processed message ID

return newest_message_id`

We'll use this function in a background thread. We'll start the thread in manual memory mode but not in tool mode, and we'll run it as a worker that pulls message histories from a `Queue` to process:

`Queue`
`import time
from queue import Queue
DEFAULT_MEMORY_WORKER_INTERVAL = 5 _ 60 # 5 minutes
DEFAULT_MEMORY_WORKER_BACKOFF_INTERVAL = 10 _ 60 # 10 minutes

def memory_worker(
memory_queue: Queue,
user_id: str,
interval: int = DEFAULT_MEMORY_WORKER_INTERVAL,
backoff_interval: int = DEFAULT_MEMORY_WORKER_BACKOFF_INTERVAL,
):
"""Worker function that processes long-term memory extraction requests"""
key = f"memory_worker:{user_id}:last_processed_message_id"

last_processed_message_id = redis_client.get(key)
logger.debug(f"Last processed message ID: {last_processed_message_id}")
last_processed_message_id = (
str(last_processed_message_id) if last_processed_message_id else None
)

while True:
try:

# Get the next state and config from the queue (blocks until an item is available)

state, config = memory_queue.get()

# Extract long-term memories from the conversation history

last_processed_message_id = extract_memories(
last_processed_message_id, state, config
)
logger.debug(
f"Memory worker extracted memories. Last processed message ID: {last_processed_message_id}"
)

if last_processed_message_id:
logger.debug(
f"Setting last processed message ID: {last_processed_message_id}"
)
redis_client.set(key, last_processed_message_id)

# Mark the task as done

memory_queue.task_done()
logger.debug("Memory extraction completed for queue item")

# Wait before processing next item

time.sleep(interval)
except Exception as e:

# Wait before processing next item after an error

logger.exception(f"Error in memory worker thread: {e}")
time.sleep(backoff_interval)

# NOTE: We'll actually start the worker thread later, in the main loop.`

## Augmenting queries with relevant memories[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#augmenting-queries-with-relevant-memories)

For every user interaction with the agent, we'll query for relevant memories and add them to the LLM prompt with `retrieve_relevant_memories()`.

`retrieve_relevant_memories()`

**NOTE:** We only run this node in the "manual" memory management strategy. If using "tools," the LLM will decide when to retrieve memories.

`def retrieve_relevant_memories(
state: RuntimeState, config: RunnableConfig
) -> RuntimeState:
"""Retrieve relevant memories based on the current conversation."""
if not state["messages"]:
logger.debug("No messages in state")
return state
latest_message = state["messages"][-1]
if not isinstance(latest_message, HumanMessage):
logger.debug("Latest message is not a HumanMessage: ", latest_message)
return state
user_id = config.get("configurable", {}).get("user_id", SYSTEM_USER_ID)

query = str(latest_message.content)
relevant_memories = retrieve_memories(
query=query,
memory_type=[MemoryType.EPISODIC, MemoryType.SEMANTIC],
limit=5,
user_id=user_id,
distance_threshold=0.3,
)

logger.debug(f"All relevant memories: {relevant_memories}")

# We'll augment the latest human message with the relevant memories.

if relevant_memories:
memory_context = "\n\n### Relevant memories from previous conversations:\n"

# Group by memory type

memory_types = {
MemoryType.EPISODIC: "User Preferences & History",
MemoryType.SEMANTIC: "Travel Knowledge",
}

for mem_type, type_label in memory_types.items():
memories_of_type = [
m for m in relevant_memories if m.memory_type == mem_type
]
if memories_of_type:
memory_context += f"\n**{type_label}**:\n"
for mem in memories_of_type:
memory_context += f"- {mem.content}\n"

augmented_message = HumanMessage(content=f"{query}\n{memory_context}")
state["messages"][-1] = augmented_message
logger.debug(f"Augmented message: {augmented_message.content}")

return state.copy()`

This is the first function we've seen that represents a **node** in the LangGraph graph we'll build. As a node representation, this function receives a state object containing the runtime state of the graph, which is where conversation history resides. Its config parameter contains data like the user and thread IDs.

This will be the starting node in the graph we'll assemble later. When a user invokes the graph with a message, the first thing we'll do (when using the "manual" memory strategy) is augment that message with potentially related memories.

## Defining tools[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#defining-tools)

Now that we have our storage functions defined, we can create **tools**. We'll need these to set up our agent in a moment. These tools will only be used when the agent is operating in "tools" memory management mode.

`from langchain_core.tools import tool
from typing import Dict, Optional

@tool
def store_memory_tool(
content: str,
memory_type: MemoryType,
metadata: Optional[Dict[str, str]] = None,
config: Optional[RunnableConfig] = None,
) -> str:
"""
Store a long-term memory in the system.
Use this tool to save important information about user preferences,
experiences, or general knowledge that might be useful in future
interactions.
"""
config = config or RunnableConfig()
user_id = config.get("user_id", SYSTEM_USER_ID)
thread_id = config.get("thread_id")

try:

# Store in long-term memory

store_memory(
content=content,
memory_type=memory_type,
user_id=user_id,
thread_id=thread_id,
metadata=str(metadata) if metadata else None,
)

return f"Successfully stored {memory_type} memory: {content}"
except Exception as e:
return f"Error storing memory: {str(e)}"

@tool
def retrieve_memories_tool(
query: str,
memory_type: List[MemoryType],
limit: int = 5,
config: Optional[RunnableConfig] = None,
) -> str:
"""
Retrieve long-term memories relevant to the query.
Use this tool to access previously stored information about user
preferences, experiences, or general knowledge.
"""
config = config or RunnableConfig()
user_id = config.get("user_id", SYSTEM_USER_ID)

try:

# Get long-term memories

stored_memories = retrieve_memories(
query=query,
memory_type=memory_type,
user_id=user_id,
limit=limit,
distance_threshold=0.3,
)

# Format the response

response = []

if stored_memories:
response.append("Long-term memories:")
for memory in stored_memories:
response.append(f"- [{memory.memory_type}] {memory.content}")

return "\n".join(response) if response else "No relevant memories found."

except Exception as e:
return f"Error retrieving memories: {str(e)}"`

## Creating the agent[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#creating-the-agent)

Because we're using different LLM objects configured for different purposes and a prebuilt ReAct agent, we need a node that invokes the agent and returns the response. But before we can invoke the agent, we need to set it up. This will involve defining the tools the agent will need.

`import json
from typing import Dict, List, Optional, Tuple, Union
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.callbacks.manager import CallbackManagerForToolRun
from langchain_core.messages import AIMessage, AIMessageChunk, SystemMessage
from langgraph.prebuilt.chat_agent_executor import create_react_agent
from langgraph.checkpoint.redis import RedisSaver

class CachingTavilySearchResults(TavilySearchResults):
"""
An interface to Tavily search that caches results in Redis.
Caching the results of the web search allows us to avoid rate limiting,
improve latency, and reduce costs.
"""

def \_run(
self,
query: str,
run_manager: Optional[CallbackManagerForToolRun] = None,
) -> Tuple[Union[List[Dict[str, str]], str], Dict]:
"""Use the tool."""
cache_key = f"tavily_search:{query}"
cached_result: Optional[str] = redis_client.get(cache_key) # type: ignore
if cached_result:
return json.loads(cached_result), {}
else:
result, raw_results = super().\_run(query, run_manager)
redis_client.set(cache_key, json.dumps(result), ex=60 \* 60)
return result, raw_results

# Create a checkpoint saver for short-term memory. This keeps track of the

# conversation history for each thread. Later, we'll continually summarize the

# conversation history to keep the context window manageable, while we also

# extract long-term memories from the conversation history to store in the

# long-term memory index.

redis_saver = RedisSaver(redis_client=redis_client)
redis_saver.setup()

# Configure an LLM for the agent with a more creative temperature.

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

# Uncomment these lines if you have a Tavily API key and want to use the web

# search tool. The agent is much more useful with this tool.

# web_search_tool = CachingTavilySearchResults(max_results=2)

# base_tools = [web_search_tool]

base_tools = []

if memory_strategy == MemoryStrategy.TOOLS:
tools = base_tools + [store_memory_tool, retrieve_memories_tool]
elif memory_strategy == MemoryStrategy.MANUAL:
tools = base_tools

travel_agent = create_react_agent(
model=llm,
tools=tools,
checkpointer=redis_saver, # Short-term memory: the conversation history
prompt=SystemMessage(
content="""
You are a travel assistant helping users plan their trips. You remember user preferences
and provide personalized recommendations based on past interactions.
You have access to the following types of memory:

1.  Short-term memory: The current conversation thread
2.  Long-term memory:

- Episodic: User preferences and past trip experiences (e.g., "User prefers window seats")
- Semantic: General knowledge about travel destinations and requirements
  Your procedural knowledge (how to search, book flights, etc.) is built into your tools and prompts.
  Always be helpful, personal, and context-aware in your responses.
  """
  ),
  )`

## Responding to the user[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#responding-to-the-user)

Now we can write our node that invokes the agent and responds to the user:

`def respond_to_user(state: RuntimeState, config: RunnableConfig) -> RuntimeState:
"""Invoke the travel agent to generate a response."""
human_messages = [m for m in state["messages"] if isinstance(m, HumanMessage)]
if not human_messages:
logger.warning("No HumanMessage found in state")
return state
try:
for result in travel_agent.stream(
{"messages": state["messages"]}, config=config, stream_mode="messages"
):
result_messages = result.get("messages", [])

ai_messages = [
m
for m in result_messages
if isinstance(m, AIMessage) or isinstance(m, AIMessageChunk)
]
if ai_messages:
agent_response = ai_messages[-1]

# Append only the agent's response to the original state

state["messages"].append(agent_response)

except Exception as e:
logger.error(f"Error invoking travel agent: {e}")
agent_response = AIMessage(
content="I'm sorry, I encountered an error processing your request."
)
return state`

## Summarizing conversation history[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#summarizing-conversation-history)

We've been focusing on long-term memory, but let's bounce back to short-term memory for a moment. With `RedisSaver`, LangGraph will manage our message history automatically. Still, the message history will continue to grow indefinitely, until it overwhelms the LLM's token context window.

`RedisSaver`

To solve this problem, we'll add a node to the graph that summarizes the conversation if it's grown past a threshold.

`from langchain_core.messages import RemoveMessage

# An LLM configured for summarization.

summarizer = ChatOpenAI(model="gpt-4o", temperature=0.3)

# The number of messages after which we'll summarize the conversation.

MESSAGE_SUMMARIZATION_THRESHOLD = 10

def summarize_conversation(
state: RuntimeState, config: RunnableConfig
) -> Optional[RuntimeState]:
"""
Summarize a list of messages into a concise summary to reduce context length
while preserving important information.
"""
messages = state["messages"]
current_message_count = len(messages)
if current_message_count < MESSAGE_SUMMARIZATION_THRESHOLD:
logger.debug(f"Not summarizing conversation: {current_message_count}")
return state
system_prompt = """
You are a conversation summarizer. Create a concise summary of the previous
conversation between a user and a travel assistant.
The summary should:

1.  Highlight key topics, preferences, and decisions
2.  Include any specific trip details (destinations, dates, preferences)
3.  Note any outstanding questions or topics that need follow-up
4.  Be concise but informative
    Format your summary as a brief narrative paragraph.
    """

message_content = "\n".join(
[
f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg.content}"
for msg in messages
]
)

# Invoke the summarizer

summary_messages = [
SystemMessage(content=system_prompt),
HumanMessage(
content=f"Please summarize this conversation:\n\n{message_content}"
),
]

summary_response = summarizer.invoke(summary_messages)

logger.info(f"Summarized {len(messages)} messages into a conversation summary")

summary_message = SystemMessage(
content=f"""
Summary of the conversation so far:
{summary_response.content}

Please continue the conversation based on this summary and the recent messages.
"""
)
remove_messages = [
RemoveMessage(id=msg.id) for msg in messages if msg.id is not None
]

state["messages"] = [ # type: ignore
\*remove_messages,
summary_message,
state["messages"][-1],
]

return state.copy()`

## Assembling the graph[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#assembling-the-graph)

It's time to assemble our graph.

`from langgraph.graph import StateGraph, END, START
workflow = StateGraph(RuntimeState)

workflow.add_node("respond", respond_to_user)
workflow.add_node("summarize_conversation", summarize_conversation)

if memory_strategy == MemoryStrategy.MANUAL:

# In manual memory mode, we'll retrieve relevant memories before

# responding to the user, and then augment the user's message with the

# relevant memories.

workflow.add_node("retrieve_memories", retrieve_relevant_memories)
workflow.add_edge(START, "retrieve_memories")
workflow.add_edge("retrieve_memories", "respond")
else:

# In tool-calling mode, we'll respond to the user and let the LLM

# decide when to retrieve and store memories, using tool calls.

workflow.add_edge(START, "respond")

# Regardless of memory strategy, we'll summarize the conversation after

# responding to the user, to keep the context window manageable.

workflow.add_edge("respond", "summarize_conversation")
workflow.add_edge("summarize_conversation", END)

# Finally, compile the graph.

graph = workflow.compile(checkpointer=redis_saver)`

## Consolidating memories in a background thread[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#consolidating-memories-in-a-background-thread)

We're almost ready to create the main loop that runs our graph. First, though, let's create a worker that consolidates similar memories on a regular schedule, using semantic search. We'll run the worker in a background thread later, in the main loop.

`from redisvl.query import FilterQuery
def consolidate_memories(user_id: str, batch_size: int = 10):
"""
Periodically merge similar long-term memories for a user.
"""
logger.info(f"Starting memory consolidation for user {user_id}")

# For each memory type, consolidate separately

for memory_type in MemoryType:
all_memories = []

# Get all memories of this type for the user

of_type_for_user = (Tag("user_id") == user_id) & (
Tag("memory_type") == memory_type
)
filter_query = FilterQuery(filter_expression=of_type_for_user)

for batch in long_term_memory_index.paginate(filter_query, page_size=batch_size):
all_memories.extend(batch)

all_memories = long_term_memory_index.query(filter_query)
if not all_memories:
continue

# Group similar memories

processed_ids = set()
for memory in all_memories:
if memory["id"] in processed_ids:
continue

memory_embedding = memory["embedding"]
vector_query = VectorRangeQuery(
vector=memory_embedding,
num_results=10,
vector_field_name="embedding",
filter_expression=of_type_for_user
& (Tag("memory_id") != memory["memory_id"]),
distance_threshold=0.1,
return_fields=[
"content",
"metadata",
],
)
similar_memories = long_term_memory_index.query(vector_query)

# If we found similar memories, consolidate them

if similar_memories:
combined_content = memory["content"]
combined_metadata = memory["metadata"]

if combined_metadata:
try:
combined_metadata = json.loads(combined_metadata)
except Exception as e:
logger.error(f"Error parsing metadata: {e}")
combined_metadata = {}

for similar in similar_memories:

# Merge the content of similar memories

combined_content += f" {similar['content']}"

if similar["metadata"]:
try:
similar_metadata = json.loads(similar["metadata"])
except Exception as e:
logger.error(f"Error parsing metadata: {e}")
similar_metadata = {}

combined_metadata = {**combined_metadata, **similar_metadata}

# Create a consolidated memory

new_metadata = {
"consolidated": True,
"source_count": len(similar_memories) + 1,
\*\*combined_metadata,
}
consolidated_memory = {
"content": summarize_memories(combined_content, memory_type),
"memory_type": memory_type.value,
"metadata": json.dumps(new_metadata),
"user_id": user_id,
}

# Delete the old memories

delete_memory(memory["id"])
for similar in similar_memories:
delete_memory(similar["id"])

# Store the new consolidated memory

store_memory(
content=consolidated_memory["content"],
memory_type=memory_type,
user_id=user_id,
metadata=consolidated_memory["metadata"],
)

logger.info(
f"Consolidated {len(similar_memories) + 1} memories into one"
)

def delete_memory(memory_id: str):
"""Delete a memory from Redis"""
try:
result = long_term_memory_index.drop_keys([memory_id])
except Exception as e:
logger.error(f"Deleting memory {memory_id} failed: {e}")
if result == 0:
logger.debug(f"Deleting memory {memory_id} failed: memory not found")
else:
logger.info(f"Deleted memory {memory_id}")

def summarize_memories(combined_content: str, memory_type: MemoryType) -> str:
"""Use the LLM to create a concise summary of similar memories"""
try:
system_prompt = f"""
You are a memory consolidation assistant. Your task is to create a single,
concise memory from these similar memory fragments. The new memory should
be a {memory_type.value} memory.
Combine the information without repetition while preserving all important details.
"""

messages = [
SystemMessage(content=system_prompt),
HumanMessage(
content=f"Consolidate these similar memories into one:\n\n{combined_content}"
),
]

response = summarizer.invoke(messages)
return str(response.content)
except Exception as e:
logger.error(f"Error summarizing memories: {e}")

# Fall back to just using the combined content

return combined_content

def memory_consolidation_worker(user_id: str):
"""
Worker that periodically consolidates memories for the active user.
NOTE: In production, this would probably use a background task framework, such
as rq or Celery, and run on a schedule.
"""
while True:
try:
consolidate_memories(user_id)

# Run every 10 minutes

time.sleep(10 \* 60)
except Exception as e:
logger.exception(f"Error in memory consolidation worker: {e}")

# If there's an error, wait an hour and try again

time.sleep(60 \* 60)`

## The main loop[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#the-main-loop)

Now we can put everything together and run the main loop.

Running this cell should ask for your OpenAI and Tavily keys, then a username and thread ID. You'll enter a loop in which you can enter queries and see responses from the agent printed below the following cell.

`import threading

def main(thread_id: str = "book_flight", user_id: str = "demo_user"):
"""Main interaction loop for the travel agent"""
print("Welcome to the Travel Assistant! (Type 'exit' to quit)")

config = RunnableConfig(configurable={"thread_id": thread_id, "user_id": user_id})
state = RuntimeState(messages=[])

# If we're using the manual memory strategy, we need to create a queue for

# memory processing and start a worker thread. After every 'round' of a

# conversation, the main loop will add the current state and config to the

# queue for memory processing.

if memory_strategy == MemoryStrategy.MANUAL:

# Create a queue for memory processing

memory_queue = Queue()

# Start a worker thread that will process memory extraction tasks

memory_thread = threading.Thread(
target=memory_worker, args=(memory_queue, user_id), daemon=True
)
memory_thread.start()

# We always run consolidation in the background, regardless of memory strategy.

consolidation_thread = threading.Thread(
target=memory_consolidation_worker, args=(user_id,), daemon=True
)
consolidation_thread.start()

while True:
user_input = input("\nYou (type 'quit' to quit): ")

if not user_input:
continue

if user_input.lower() in ["exit", "quit"]:
print("Thank you for using the Travel Assistant. Goodbye!")
break

state["messages"].append(HumanMessage(content=user_input))

try:

# Process user input through the graph

for result in graph.stream(state, config=config, stream_mode="values"):
state = RuntimeState(\*\*result)

logger.debug(f"# of messages after run: {len(state['messages'])}")

# Find the most recent AI message, so we can print the response

ai_messages = [m for m in state["messages"] if isinstance(m, AIMessage)]
if ai_messages:
message = ai_messages[-1].content
else:
logger.error("No AI messages after run")
message = "I'm sorry, I couldn't process your request properly."

# Add the error message to the state

state["messages"].append(AIMessage(content=message))

print(f"\nAssistant: {message}")

# Add the current state to the memory processing queue

if memory_strategy == MemoryStrategy.MANUAL:
memory_queue.put((state.copy(), config))

except Exception as e:
logger.exception(f"Error processing request: {e}")
error_message = "I'm sorry, I encountered an error processing your request."
print(f"\nAssistant: {error_message}")

# Add the error message to the state

state["messages"].append(AIMessage(content=error_message))

try:
user_id = input("Enter a user ID: ") or "demo_user"
thread_id = input("Enter a thread ID: ") or "demo_thread"
except Exception:

# If we're running in CI, we don't have a terminal to input from, so just exit

exit()
else:
main(thread_id, user_id)`

## That's a wrap. Let’s start building[#](/learn/what-is-agent-memory-example-using-lang-graph-and-redis#thats-a-wrap-lets-start-building)

Want to make your own agent? Try the [LangGraph Quickstart](https://langchain-ai.github.io/langgraph/tutorials/introduction/). Then add our [Redis checkpointer](https://github.com/redis-developer/langgraph-redis) to give your agent fast, persistent memory.

Using Redis to manage memory for your AI Agent lets you build a flexible and scalable system that can store and retrieve memories fast. Check out the resources below to start building with Redis today, or connect with our team to chat about AI Agents.

[**Redis Cloud**](https://redis.io/try-free/)**: The easiest way to deploy Redis—try it free on AWS, Azure, or GCP.**

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
