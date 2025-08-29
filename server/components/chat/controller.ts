import getClient from "../../redis";
import { llm, embedText } from "../../services/ai/ai";
import { randomUlid } from "../../utils/uid";
import logger from "../../utils/log";
import * as view from "./view";
import * as memory from "../memory";
import { ctrl as orchestrator } from "../orchestrator";

async function flush(userId: string) {
  const db = getClient();
  const keys = await db.keys("users:*");
  const semantic = await db.keys("semantic-memory*");

  if (Array.isArray(semantic) && semantic.length > 0) {
    keys.push(...semantic);
  }

  if (Array.isArray(keys) && keys.length > 0) {
    await db.del(keys);
  }

  const indexes = await db.ft._list();

  await Promise.all(
    indexes
      .filter((index) => {
        return index.includes(userId) || index.includes("semantic-memory");
      })
      .map(async (index) => {
        await db.ft.dropIndex(index);
      }),
  );
}

async function getChat(userId: string, chatId?: string) {
  const redis = getClient();

  return memory.ShortTermMemoryModel.FromSessionId(redis, userId, chatId, {
    createUid: () => randomUlid(),
  });
}

async function getWorkingMemory(userId: string) {
  const redis = getClient();

  return memory.WorkingMemoryModel.New(redis, userId, {
    createUid: () => randomUlid(),
    vectorDimensions: llm.dimensions,
    embed: embedText,
  });
}

/**
 * Clears all messages for a given user.
 */
export async function clearChat(
  send: (message: string) => void,
  userId: string,
  chatId: string,
) {
  try {
    logger.debug(`Clearing messages for user \`${userId}\``, {
      userId: userId,
    });

    const chat = await getChat(userId, chatId);
    await chat.clear();
    send(view.clearMessages());
  } catch (error) {
    logger.error(`Failed to delete messages for user ${userId}:`, {
      error,
      userId: userId,
    });
    throw error;
  }
}

/**
 * Clears the entire store.
 */
export async function clearMemory(
  send: (message: string) => void,
  userId: string,
) {
  try {
    logger.debug("Clearing Redis", {
      userId,
    });
    await flush(userId);
    send(view.clearMessages());
  } catch (error) {
    logger.error("Failed to clear memory:", {
      error,
      userId,
    });
    throw error;
  }
}

/**
 * Asks the LLM for a response to the given prompt.
 *
 * @param {string} userId - The ID of the chat user.
 * @param {string} chatId - The ID of the chat user.
 */
// export async function ask(userId: string, chatId: string, context: any) {
//   const chat = await getChat(userId, chatId);
//   const workingMemory = await getWorkingMemory(userId);
//   const tools = Tools.New(workingMemory);
//   const messages = await chat.messages();
//   const question = messages[messages.length - 1].content;

//   try {
//     logger.info(
//       `Retrieved ${messages.length} messages from user \`${userId}\``,
//       {
//         userId,
//       },
//     );

//     const result = await answerPrompt(messages, tools);

//     logger.info(`LLM response received for question: ${question}`, {
//       userId,
//     });

//     return result;
//   } catch (error) {
//     logger.error(`Failed to ask LLM \`${question}\`:`, {
//       error,
//       userId,
//       prompt: question,
//     });
//     throw error;
//   }
// }

/**
 * Handles incoming chat messages from the client.
 */
export async function processChat(
  send: (message: string) => void,
  {
    userId,
    chatId,
    message,
  }: { userId: string; chatId?: string; message: string },
): Promise<string> {
  let botResponseSent = false;
  const chat = await getChat(userId, chatId);
  chatId = chat.sessionId;
  let response: memory.ShortTermMemory = {
    id: `bot-${randomUlid()}`,
    role: "assistant",
    content: "...",
    timestamp: Date.now(),
  };
  const botId = response.id;

  try {
    logger.debug(`Processing message for user \`${userId}\``, {
      userId,
    });

    const userMessage = await chat.push({
      role: "user",
      content: message,
    });

    logger.debug(`Message added for user \`${userId}\``, {
      userId,
    });

    send(view.renderMessage(userMessage));

    send(view.renderMessage(response));
    botResponseSent = true;

    // response.content = await orchestrator.processIncommingMessage(userId, chat);
    response = await chat.push(response);

    logger.debug(`Bot message added to stream for user \`${userId}\``, {
      userId,
    });

    const replacement = view.renderMessage({
      ...response,
      replaceId: botId,
    });

    send(replacement);

    return chatId;
  } catch (error) {
    console.log(error);
    logger.error(`Error handling message:`, {
      error,
      userId,
    });

    const message: memory.ShortTermMemory = {
      id: botId,
      content: "An error occurred while processing your message.",
      role: "assistant",
      timestamp: Date.now(),
    };

    if (botResponseSent) {
      send(
        view.renderMessage({
          replaceId: botId,
          ...message,
        }),
      );
    } else {
      send(view.renderMessage(message));
    }
  }

  return chatId;
}

/**
 * Creates a new chat user.
 */
export async function newChat(
  send: (message: string) => void,
  userId: string,
): Promise<string> {
  try {
    logger.debug(`Creating new chat for user \`${userId}\``, {
      userId,
    });
    const newChat = await memory.ShortTermMemoryModel.New(getClient(), userId, {
      createUid: () => randomUlid(),
    });
    const newChatId = newChat.sessionId;
    const existingChats = await memory.ShortTermMemoryModel.AllSessions(
      getClient(),
      userId,
      {
        createUid: () => randomUlid(),
      },
    );

    const chats = [
      ...existingChats.map((chat) => {
        return {
          chatId: chat.sessionId,
          message: chat.memories[0]?.content ?? "New chat",
        };
      }),
    ];

    send(
      view.renderChats({
        chats,
        currentChatId: newChatId,
      }),
    );

    send(
      view.clearMessages({
        placeholder: true,
      }),
    );

    return newChatId;
  } catch (error) {
    logger.error(`Failed to create new chat for user \`${userId}\`:`, {
      error,
      userId,
    });
    throw error;
  }
}

/**
 * Switches the current chat user to a different chat.
 */
export async function switchChat(
  send: (message: string) => void,
  userId: string,
  chatId: string,
) {
  try {
    logger.debug(`Switching to chat \`${chatId}\` for user \`${userId}\``, {
      userId,
    });
    const db = getClient();
    const options = {
      createUid: () => randomUlid(),
    };

    const chats = await memory.ShortTermMemoryModel.AllSessions(
      db,
      userId,
      options,
    );

    send(
      view.renderChats({
        chats: chats.map((chat) => {
          return {
            chatId: chat.sessionId,
            message: chat.memories[0]?.content ?? "New chat",
          };
        }),
        currentChatId: chatId,
      }),
    );

    send(
      view.clearMessages({
        placeholder: false,
      }),
    );

    const chat = await memory.ShortTermMemoryModel.FromSessionId(
      db,
      userId,
      chatId,
      options,
    );
    const messages = await chat.memories();

    for (const message of messages) {
      send(view.renderMessage(message));
    }
  } catch (error) {
    logger.error(`Failed to switch chat for user \`${userId}\`:`, {
      error,
      userId,
    });
    throw error;
  }
}

/**
 * Initializes the chat by sending all previous messages to the WebSocket client.
 */
export async function initializeChat(
  send: (message: string) => void,
  userId: string,
  chatId: string,
) {
  try {
    logger.debug(`Initializing chat for user \`${userId}\``, {
      userId,
    });

    const db = getClient();
    const options = {
      createUid: () => randomUlid(),
    };
    const chat = await memory.ShortTermMemoryModel.FromSessionId(
      db,
      userId,
      chatId,
      options,
    );
    const messages = await chat.memories();
    const placeholder = messages.length === 0;

    send(
      view.clearMessages({
        placeholder,
      }),
    );

    for (const message of messages) {
      send(view.renderMessage(message));
    }
  } catch (error) {
    logger.error(`Failed to initialize chat for user \`${userId}\`:`, {
      error,
      userId,
    });
  }
}

/**
 * Retrieves the chat history for a given user.
 */
export async function getAllChats(userId: string) {
  try {
    logger.info(`Initializing chat history for user \`${userId}\``, {
      userId,
    });

    const existingChats = await memory.ShortTermMemoryModel.AllSessions(
      getClient(),
      userId,
      {
        createUid: () => randomUlid(),
      },
    );

    return existingChats.map((chat) => {
      return {
        chatId: chat.sessionId,
        message: chat.memories[0]?.content ?? "New chat",
      };
    });
  } catch (error) {
    logger.error(`Failed to initialize chat history for user \`${userId}\`:`, {
      error,
      userId,
    });
  }
}
