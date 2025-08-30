import { z } from "zod";
import { llm } from "../../services/ai/ai";
import { generateText } from "ai";
import { Document } from "../documents/controller";

export async function answerQuestionWithRag(prompt: string, files: Document[]) {
  const response = await generateText({
    model: llm.smallModel,
    prompt: `
      You are an assistant that can answer questions based on information provided from the following pages:

      Use the information from the following pages to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

Pages:
${files.map((files) => `- ${files.url}\n\`\`\`md\n${files.content}\n\`\`\``).join("\n\n")}

Question:
${prompt}

Answer in a concise manner.
    `,
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return response.text;
}
