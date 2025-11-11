#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LegalToolsService } from './shared/LegalToolsService.js';

const legalTools = new LegalToolsService();

const server = new Server(
  {
    name: 'mcp-cerebra-legal-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.onerror = (error) => {
  console.error('MCP Server error:', error);
};

process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down...');
  await server.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: legalTools.listTools(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`STDIO tool call request: ${request.params.name}`);
  return legalTools.callTool(request.params.name, request.params.arguments);
});

async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('CerebraLegalServer running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
