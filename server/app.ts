import express from "express";
import { engine } from "express-handlebars";
import type { HelperOptions } from "handlebars";
import session from "./utils/session";
import { ctrl as chat } from "./components/chats";
import { ctrl as documents } from "./components/documents";
import { ctrl as projects } from "./components/projects";

export async function initialize() {
  await documents.initialize();
  await projects.initialize();
}

const app = express();
app.use(express.static("public"));
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    helpers: {
      /**
       * Checks if two values are equal.
       */
      ifEqual(options: HelperOptions) {
        const { a, b } = options.hash;
        return a == b ? options.fn(this) : options.inverse(this);
      },
      isEqual(options: HelperOptions) {
        const { a, b } = options.hash;
        return a === b;
      },
    },
  }),
);
app.set("view engine", "hbs");
app.set("views", "./views");
app.use(session);

app.get("/chat", async (req, res) => {
  const userId = req.session.id;
  // @ts-ignore
  const currentChatId = req.session.currentChatId;
  const chats = await chat.getChatsWithTopMessage(userId);

  res.render("chat", {
    page: "chat",
    userId,
    currentChatId,
    chats,
    placeholder: !currentChatId,
  });
});

app.get("/", async (req, res) => {
  const userId = req.session.id;

  // @ts-ignore
  const currentProjectId = req.session.currentProjectId;
  const allProjects = await projects.all(userId);

  res.render("index", {
    page: "projects",
    userId,
    currentProjectId,
    projects: allProjects,
    placeholder: !currentProjectId,
  });
});

app.get("/documents/:documentId.md", async (req, res) => {
  const userId = req.session.id;
  const { documentId } = req.params;

  const document = await documents.read(userId, documentId);

  if (!document) {
    res.status(404).send("Document not found");
    return;
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${document.id}.md"`,
  );
  res.setHeader("Content-Type", "text/markdown");
  res.send(document.content);
});

export default app;
