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
    "get-pep-by-code",
    "Get info about a PEP level 4 (N4), with data of cost center, country, area, ledger account, business flag, division, management, etc.",
    {
      pepCode: z
        .string()
        .describe(
          "PEP code with format 'XX-XX-XXXX-XX', otherwise 'null' not allowed"
        ),
    },
    async ({ pepCode }: { pepCode: string }) => {
      const allPeps = [
        {
          code: "AG-AT-1193-HP",
          country: "Chile",
          currency: "CLP",
          serviceCode: "2048",
          service: "Automatización de procesos internos",
          area: "Innovación",
          ledgerAccount: "Consultoría",
        },
        {
          code: "AG-BR-1213-SW",
          country: "Brasil",
          currency: "BRL",
          serviceCode: "3127",
          service: "Desarrollo de plataforma móvil",
          area: "Tecnología",
          ledgerAccount: "Licencias de software",
        },
        {
          code: "AG-BR-1298-HP",
          country: "Argentina",
          currency: "ARS",
          serviceCode: "4501",
          service: "Capacitación de equipos",
          area: "Recursos Humanos",
          ledgerAccount: "Honorarios externos",
        },
        {
          code: "AG-BR-1336-HP",
          country: "Uruguay",
          currency: "UYU",
          serviceCode: "5823",
          service: "Soporte técnico regional",
          area: "Back Office",
          ledgerAccount: "Gastos operativos",
        },
        {
          code: "AG-BR-1361-HP",
          country: "Chile",
          currency: "CLP",
          serviceCode: "6274",
          service: "Integración con sistemas externos",
          area: "Integraciones",
          ledgerAccount: "Servicios profesionales",
        },
        {
          code: "AG-BR-1377-HP",
          country: "Argentina",
          currency: "ARS",
          serviceCode: "7150",
          service: "Mejoras en infraestructura IT",
          area: "Infraestructura",
          ledgerAccount: "Mantenimiento",
        },
        {
          code: "UG-VO-1310-GG",
          country: "Brasil",
          currency: "BRL",
          serviceCode: "8392",
          service: "Gestión de proyectos",
          area: "PMO",
          ledgerAccount: "Honorarios consultores",
        },
        {
          code: "UG-VO-1310-RH",
          country: "Uruguay",
          currency: "UYU",
          serviceCode: "9135",
          service: "Administración de nómina",
          area: "Recursos Humanos",
          ledgerAccount: "Salarios",
        },
        {
          code: "UG-VO-1311-GG",
          country: "Chile",
          currency: "CLP",
          serviceCode: "1047",
          service: "Análisis financiero",
          area: "Finanzas",
          ledgerAccount: "Gastos generales",
        },
        {
          code: "UG-VO-1311-RH",
          country: "Argentina",
          currency: "ARS",
          serviceCode: "1189",
          service: "Reclutamiento y selección",
          area: "Recursos Humanos",
          ledgerAccount: "Honorarios RRHH",
        },
        {
          code: "UG-VO-1312-GG",
          country: "Uruguay",
          currency: "UYU",
          serviceCode: "1256",
          service: "Optimización logística",
          area: "Logística",
          ledgerAccount: "Gastos operativos",
        },
        {
          code: "UG-VO-1312-RH",
          country: "Brasil",
          currency: "BRL",
          serviceCode: "1384",
          service: "Capacitación interna",
          area: "Capacitación",
          ledgerAccount: "Gastos RRHH",
        },
        {
          code: "UG-VO-1501-GG",
          country: "Chile",
          currency: "CLP",
          serviceCode: "1523",
          service: "Representación corporativa",
          area: "Relaciones Públicas",
          ledgerAccount: "Gastos generales",
        },
        {
          code: "UG-VO-2351-AL",
          country: "Argentina",
          currency: "ARS",
          serviceCode: "2387",
          service: "Servicios de catalogación",
          area: "Archivo",
          ledgerAccount: "Alquileres y servicios",
        },
      ];

      const data = allPeps.filter((pep) => pep.code.includes(pepCode));
      if (!data) {
        return {
          content: [
            {
              text: "PEP not found",
              type: "text",
            },
          ],
        };
      }

      return {
        content: [
          {
            text: JSON.stringify(data),
            type: "text",
          },
        ],
      };
    }
  );

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
