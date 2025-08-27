import * as tavily from "../../services/tavily/tavily";
import * as markdown from "../markdown";

export async function crawlUrl(
  userId: string,
  url: string,
  instructions: string,
) {
  const files = await tavily.crawl(url, instructions);

  const addedFiles = await markdown.ctrl.addFiles(
    userId,
    files.map((f) => ({
      url: f.url,
      content: f.rawContent,
    })),
  );

  return addedFiles;
}
