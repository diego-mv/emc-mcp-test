import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const HEADER_SESSION = "mcp-session-id";

const router = Router();
const getServer = () => {
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

  return server;
};

router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Received POST MCP request - ", new Date().toISOString());
    const server = getServer();
    const transport: StreamableHTTPServerTransport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

router.get("/", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

router.delete("/", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});
router.get("/status", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

export default router;
