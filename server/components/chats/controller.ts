import getClient from "../../redis";
import { llm, embedText } from "../../services/ai/ai";
import { randomUlid } from "../../utils/uid";
import logger from "../../utils/log";
import * as view from "./view";
import * as memory from "../memory";
import { ctrl as orchestrator } from "../orchestrator";

export async function getChatSession(userId: string, chatId?: string) {
  const redis = getClient();

  return memory.ShortTermMemoryModel.FromSessionId(redis, userId, chatId, {
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
  const chat = await getChatSession(userId, chatId);
  chatId = chat.sessionId;
  let response: memory.ShortTermMemory = {
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
}

/**
 * Creates a new chat user.
 */
export async function newChat(userId: string): Promise<string> {
  const newChat = await memory.ShortTermMemoryModel.New(getClient(), userId, {
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
