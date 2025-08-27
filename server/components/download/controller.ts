import fs from "fs/promises";
import path from "path";
import { ctrl as markdown } from "../markdown";
import config from "../../config";
import { MarkdownFile } from "../markdown/controller";

export async function prepareForDownload(userId: string, pageName: string) {
  const files = await markdown.searchFiles(userId, pageName);

  if (files.length === 0) {
    throw new Error("No files found for download");
  }

  const file = files[0];

  const dir = path.join(process.cwd(), "public", "downloads", userId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${file.id}.md`);
  await fs.writeFile(filePath, file.content, "utf-8");

  return `${config.app.URL}/downloads/${userId}/${path.basename(filePath)}`;
}

export async function updateDownload(userId: string, file: MarkdownFile) {
  const dir = path.join(process.cwd(), "public", "downloads", userId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${file.id}.md`);
  const exists = await fs.exists(filePath);

  if (exists) {
    await fs.writeFile(filePath, file.content, "utf-8");
  }
}
