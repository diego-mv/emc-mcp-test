import express from "express";
import mcpRouter from "./routes/mcp.routes";

const app = express();
app.use(express.json());

app.use("/mcp", mcpRouter);

app.listen(3000, () => {
  console.log("MCP server listening on port 3000");
});
