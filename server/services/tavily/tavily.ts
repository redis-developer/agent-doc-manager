import { tavily } from "@tavily/core";
import config from "../../config";

const tvly = tavily({
  apiKey: config.tavily.API_KEY,
});

export async function extract(urls: string[]) {
  const chunkSize = 20;

  if (urls.length > chunkSize) {
    const chunks = [];
    for (let i = 0; i < urls.length; i += chunkSize) {
      chunks.push(urls.slice(i, i + chunkSize));
    }

    const results = [];
    for (const chunk of chunks) {
      const res = await tvly.extract(chunk, {
        format: "markdown",
      });
      results.push(...res.results);
    }

    return { results };
  }

  return tvly.extract(urls, {
    format: "markdown",
  });
}

export async function crawl(url: string, instructions: string) {
  const response = await tvly.crawl(url, {
    // instructions: `Find all the pages listed under "HowTos & Tutorials"`,
    instructions,
    format: "markdown",
    limit: 3,
  });

  return response.results;
}
