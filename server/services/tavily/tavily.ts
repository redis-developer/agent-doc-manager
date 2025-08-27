import { tavily } from "@tavily/core";
import config from "../../config";

const tvly = tavily({
  apiKey: config.tavily.API_KEY,
});

export async function extract(url: string) {
  return tvly.extract([url], {
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
