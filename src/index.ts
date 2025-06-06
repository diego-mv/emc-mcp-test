import express from "express";
import mcpRoutes from "./routes/mcp.routes.js";

const app = express();
app.use(express.json());

app.use("/mcp", mcpRoutes);

app.listen(3000, () => {
  console.log("MCP server listening on port 3000");
});
