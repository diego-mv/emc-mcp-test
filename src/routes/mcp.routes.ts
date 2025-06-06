import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const HEADER_SESSION = "mcp-session-id";

const router = Router();

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handles POST requests for client-to-server communication
router.post("/", async (req: Request, res: Response) => {
  const sessionId = req.headers[HEADER_SESSION] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        transports[newSessionId] = transport;
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: "emc-mcp",
      version: "1.0.0",
    });

    server.tool(
      "emc-members",
      "get a list of members of 'EMC' team",
      {},
      async (req) => {
        const members = [
          "Diego Morales (pais:Chile, email:diego.moralesvaldivia@externos-cl.cencosud.com)",
          "Bastián Ayala (pais:Chile, email:bastian.ayala@externos-cl.cencosud.com)",
          "Mariano Gilbert (pais:Argentina, email:mariano.gilbert@externos-cl.cencosud.com)",
          "Ian Lopez (pais:Chile, email:ian.lopezcandia@externos-cl.cencosud.com)",
          "Carlos Fernandez (pais:Cuba, email:carlos.fernandezmadrazo@externos-cl.cencosud.com)",
          "Carlos Perez (pais:Cuba, email:carlosjavier.mutuberria@externos-cl.cencosud.com)",
        ];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(members),
            },
          ],
        };
      }
    );

    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Invalid Request: Invalid session ID",
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// Handles GET and DELETE requests for notifications and session termination
const handleSessionRequest = async (req: Request, res: Response) => {
  const sessionId = req.headers[HEADER_SESSION] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Session id not found");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

router.get("/", handleSessionRequest);
router.delete("/", handleSessionRequest);
router.get("/status", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

export default router;
