import getClient from "../../redis";
import { llm, embedText } from "../../services/ai/ai";
import { randomUlid } from "../../utils/uid";
import logger from "../../utils/log";
import * as view from "./view";
import { ShortTermMemoryModel, WorkingMemoryModel, Tools } from "../memory";
import type { ShortTermMemory } from "../memory";
import * as ai from "./ai";
import { ctrl as documents } from "../documents";
import type { DocumentChunk } from "../documents";
import { getChunkSearchTool } from "../documents/controller";

async function getWorkingMemory(userId: string) {
  const redis = getClient();

  return WorkingMemoryModel.New(redis, userId, {
    createUid: () => randomUlid(),
    vectorDimensions: llm.dimensions,
    embed: embedText,
  });
}

async function getTools(userId: string) {
  const workingMemory = await getWorkingMemory(userId);
  return Tools.New(workingMemory);
}

export async function getChatSession(userId: string, chatId?: string) {
  const redis = getClient();

  return ShortTermMemoryModel.FromSessionId(redis, userId, chatId, {
    createUid: () => randomUlid(),
  });
}

/**
 * Clears all messages for a given user.
 */
export async function clearChat(userId: string, chatId: string) {
  const chat = await getChatSession(userId, chatId);
  await chat.clear();
}

/**
 * Handles incoming chat messages from the client.
 */
export async function newChatMessage(
  updateView: (message: {
    replaceId?: string;
    id: string;
    content: string;
    role?: "user" | "assistant";
  }) => void,
  {
    botChatId,
    userId,
    chatId,
    message,
  }: { botChatId: string; userId: string; chatId?: string; message: string },
): Promise<string> {
  const workingMemory = await getWorkingMemory(userId);
  const chat = await getChatSession(userId, chatId);
  chatId = chat.sessionId;
  let response: ShortTermMemory = {
    id: botChatId,
    role: "assistant",
    content: "...",
    timestamp: Date.now(),
  };
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

  updateView(userMessage);

  updateView(response);

  logger.info(`Searching for existing response in semantic memory.`, {
    userId,
  });

  const result = await workingMemory.searchSemanticMemory(message);

  if (result.length > 0) {
    logger.info(`Found response in semantic memory`, {
      userId,
    });
    response.content = result[0].answer;
  } else {
    logger.info(`No response found in semantic memory, searching documents`, {
      userId,
    });

    const documentChunks = await documents.searchChunks(userId, message);

    logger.info(
      `Found ${documentChunks.length} relevant document chunks for RAG.`,
      {
        userId,
      },
    );

    const memoryTools = await getTools(userId);
    const chunkSearchTool = await documents.getChunkSearchTool(userId);

    response.content = await ai.answerQuestionWithRag(
      await chat.memories(),
      documentChunks,
      chunkSearchTool,
    );

    await ai.storeSemanticMemories(message, response.content, memoryTools);
  }

  response = await chat.push(response);

  logger.debug(`Bot message added to stream for user \`${userId}\``, {
    userId,
  });

  const replacement = {
    ...response,
    replaceId: botChatId,
  };

  updateView(replacement);

  return chatId;
}

export async function getChatsWithTopMessage(userId: string) {
  const existingChats = await ShortTermMemoryModel.AllSessions(
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
}

/**
 * Creates a new chat user.
 */
export async function newChat(userId: string): Promise<string> {
  const newChat = await ShortTermMemoryModel.New(getClient(), userId, {
    createUid: () => randomUlid(),
  });
  return newChat.sessionId;
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

    const chat = await getChatSession(userId, chatId);
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
