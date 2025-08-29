import * as tavily from "../../services/tavily/tavily";
import { ctrl as documents } from "../documents";

export async function crawlUrl(
  userId: string,
  projectId: string,
  url: string,
  instructions: string,
) {
  const pages = await tavily.crawl(url, instructions);

  const newDocuments = await documents.createMany(
    userId,
    projectId,
    pages.map((f) => ({
      url: f.url,
      content: f.rawContent,
    })),
  );

  return newDocuments;
}
