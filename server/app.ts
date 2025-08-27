import express from "express";
import { engine } from "express-handlebars";
import type { HelperOptions } from "handlebars";
import session from "./utils/session";
import { ctrl as chat } from "./components/chat";
import * as markdown from "./components/markdown";

export async function initialize() {
  await markdown.initialize();
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

app.get("/", async (req, res) => {
  const userId = req.session.id;
  // @ts-ignore
  const currentChatId = req.session.currentChatId;
  const chats = await chat.getAllChats(userId);

  res.render("index", {
    userId,
    currentChatId,
    chats,
    placeholder: !currentChatId,
  });
});

export default app;
