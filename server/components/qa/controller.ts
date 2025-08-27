import getClient from "../../redis";
import { embedText, llm } from "../../services/ai/ai";
import { randomUlid } from "../../utils/uid";
import { ctrl as markdown } from "../markdown";
import * as memory from "../memory";
import { answerQuestionWithRag } from "./ai";

async function getWorkingMemory(userId: string) {
  const redis = getClient();

  return memory.WorkingMemoryModel.New(redis, userId, {
    createUid: () => randomUlid(),
    vectorDimensions: llm.dimensions,
    embed: embedText,
  });
}

export async function answerQuestion(userId: string, prompt: string) {
  const workingMemory = await getWorkingMemory(userId);

  const existingResponse = await workingMemory.searchSemanticMemory(prompt);

  if (existingResponse.length > 0) {
    return existingResponse[0].answer;
  }

  const files = await markdown.searchFiles(userId, prompt);

  if (files.length === 0) {
    return "No relevant information found.";
  }

  const response = await answerQuestionWithRag(prompt, files);

  await workingMemory.addSemanticMemory(prompt, response);

  return response;
}
