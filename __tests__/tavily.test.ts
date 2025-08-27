import { afterAll, beforeEach, describe, test, mock, expect } from "bun:test";
import fs from "fs/promises";
import * as tavily from "../server/services/tavily/tavily";

describe.only("Tavily Service", () => {
  const testUrl =
    "https://redis.io/learn/what-is-agent-memory-example-using-lang-graph-and-redis";

  test("should extract content from a URL", async () => {
    const { results } = await tavily.extract(testUrl);

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);

    await fs.writeFile("./extracted.md", results[0].rawContent);
  });

  test.only("should fetch tutorials from Tavily docs", async () => {
    const { results } = await tavily.crawl(testUrl);
    expect(results).toBeDefined();

    for (const res of results) {
      await fs.writeFile(
        `./docs/${res.url.replace(/\https:\/\/redis.io\//, "").replace(/\//g, "_")}.md`,
        res.rawContent,
      );
    }
  });
});
