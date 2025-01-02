import http from "node:http";
import url from "node:url";
import { scheduler } from "./utils/index.ts";
import { authorize, generateAuthUrl } from "./auth/auth.ts";
import { syncEmailsWithExpenses } from "./api/gmail.ts";

const PORT = 3000;

const sheduleSyncEmailsWithExpenses = async (code?: string) => {
  try {
    await authorize(code);
    syncEmailsWithExpenses();
    scheduler.schedule(syncEmailsWithExpenses);
  } catch (err) {
    console.log("Error with trying authorization:", err.message);
    if (code) throw err;
  }
};

await sheduleSyncEmailsWithExpenses();

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url ?? "", true);
  const query = parsedUrl.query;

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/html" });
    const url = generateAuthUrl();
    res.end(`<a href="${url}">Login with Google</a>`);
  } else if (parsedUrl.pathname === "/google-callback") {
    const code = query.code as string;
    if (!code) {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end("Missing code parameter");
      return;
    }

    try {
      await sheduleSyncEmailsWithExpenses(code);
    } catch (err) {
      console.log("Error with authorization:", err);
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("Error retrieving access token");
      return;
    }

    res.writeHead(200, { "content-type": "text/plain" });
    res.end("Sync expense is running");
  } else if (parsedUrl.pathname === "/stop_sync") {
    scheduler.unschedule();
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("Sync expense is stopped");
  } else {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
