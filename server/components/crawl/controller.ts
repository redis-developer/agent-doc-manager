import fs from "fs/promises";
import path from "path";
import * as tavily from "../../services/tavily/tavily";
import { ctrl as documents } from "../documents";
import urls from "./urls";

async function crawlLocalDocuments(
  userId: string,
  projectId: string,
  limit?: number,
) {
  const response: { url: string; content: string }[] = [];

  const docsPath = path.join(process.cwd(), "data", "documents");
  const files = await fs.readdir(docsPath);

  for (const file of files) {
    if (file.endsWith(".md")) {
      const filePath = path.join(docsPath, file);
      const content = await fs.readFile(filePath, "utf-8");
      response.push({
        url: decodeURIComponent(file.replace(".md", "")),
        content,
      });

      if (typeof limit === "number" && response.length >= limit) {
        break;
      }
    }
  }

  const newDocuments = await documents.createMany(userId, projectId, response);

  return newDocuments;
}

async function crawlWithUrlsAndSave(userId: string, projectId: string) {
  const response = await tavily.extract(urls);

  for (const result of response.results) {
    const docsPath = path.join(process.cwd(), "data", "documents");
    await fs.mkdir(docsPath, { recursive: true });
    const filePath = path.join(
      docsPath,
      `${encodeURIComponent(result.url)}.md`,
    );
    await fs.writeFile(filePath, result.rawContent);
  }

  const newDocuments = await documents.createMany(
    userId,
    projectId,
    response.results.map((page) => ({
      url: page.url,
      content: page.rawContent,
    })),
  );

  return newDocuments;
}

export async function crawlUrl(
  userId: string,
  projectId: string,
  url: string,
  instructions: string,
) {
  return await crawlLocalDocuments(userId, projectId, 3);

  // const pages = await tavily.crawl(url, instructions);

  // const newDocuments = await documents.createMany(
  //   userId,
  //   projectId,
  //   pages.map((f) => ({
  //     url: f.url,
  //     content: f.rawContent,
  //   })),
  // );

  // return newDocuments;
}
