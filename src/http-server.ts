#!/usr/bin/env node

import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  ErrorCode,
  JSONRPCError,
  JSONRPCMessage,
  JSONRPCNotification,
  JSONRPCRequest,
  JSONRPCResponse,
  LATEST_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
} from '@modelcontextprotocol/sdk/types.js';
import { LegalToolsService } from './shared/LegalToolsService.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || '/mcp';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface Session {
  id: string;
  createdAt: number;
  lastActivity: number;
  initialized: boolean;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

class RpcError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'RpcError';
  }
}

const sessions = new Map<string, Session>();
const legalTools = new LegalToolsService();

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity >= SESSION_TIMEOUT_MS) {
      sessions.delete(sessionId);
      logger.info(`Session ${sessionId} expired and was removed`);
    }
  }
}, SESSION_TIMEOUT_MS).unref();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mcp-cerebra-legal-server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'MCP Cerebra Legal Server',
    description: 'Enterprise-grade HTTP MCP server for legal reasoning and analysis',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      mcp: MCP_ENDPOINT,
      tools: '/tools',
    },
    tools: legalTools.listTools().map((tool) => tool.name),
    documentation: 'https://github.com/anthropics/mcp-cerebra-legal-server',
  });
});

app.get('/tools', (_req, res) => {
  res.json({ tools: legalTools.listTools() });
});

app.get(MCP_ENDPOINT, (_req, res) => {
  res.status(405).json({
    error: 'Server-initiated SSE streams are not supported on this endpoint.',
  });
});

app.delete(MCP_ENDPOINT, (req, res) => {
  const sessionId = req.header('Mcp-Session-Id');
  if (!sessionId) {
    res.status(400).json({ error: 'Missing Mcp-Session-Id header' });
    return;
  }
  if (!sessions.has(sessionId)) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  sessions.delete(sessionId);
  logger.info(`Session ${sessionId} terminated via DELETE`);
  res.status(204).end();
});

app.post(MCP_ENDPOINT, async (req, res) => {
  try {
    enforceAcceptHeader(req);
    enforceJsonContent(req);
    const messages = normalizeMessages(req.body);
    if (messages.length === 0) {
      throw new HttpError(400, 'Empty JSON-RPC payload');
    }

    const headerSessionId = req.header('Mcp-Session-Id') || undefined;
    const { requests, notifications, responses } = partitionMessages(messages);

    await processNotifications(headerSessionId, notifications);
    logClientResponses(headerSessionId, responses);

    if (requests.length === 0) {
      res.status(202).end();
      return;
    }

    const hasInitialize = requests.some((request) => request.method === 'initialize');
    if (hasInitialize && requests.length > 1) {
      throw new HttpError(400, 'Initialize request must be sent separately.');
    }

    const requiresSession = requests.some((request) => request.method !== 'initialize');
    let session: Session | undefined;
    if (requiresSession) {
      const sessionId = requireSessionHeader(headerSessionId);
      session = loadSession(sessionId);
    } else if (headerSessionId) {
      session = sessions.get(headerSessionId);
    }

    openSseStream(res);
    let sessionIdResponseSet = false;

    const tasks = requests.map(async (request) => {
      try {
        const { result, newSessionId } = await handleRpcRequest(request, session);
        if (newSessionId && !sessionIdResponseSet) {
          res.setHeader('Mcp-Session-Id', newSessionId);
          sessionIdResponseSet = true;
        }
        sendSseMessage(res, {
          jsonrpc: '2.0',
          id: request.id,
          result,
        });
      } catch (error) {
        const response = createErrorResponse(request.id, error);
        sendSseMessage(res, response);
      }
    });

    await Promise.all(tasks);
    res.end();
  } catch (error) {
    handleHttpError(res, error);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  logger.error('Express error handler captured an error', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 MCP Cerebra Legal Server running on port ${PORT}`);
  logger.info(`📡 MCP endpoint: http://localhost:${PORT}${MCP_ENDPOINT}`);
});

process.on('SIGINT', () => {
  logger.warn('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.warn('Received SIGTERM, shutting down...');
  process.exit(0);
});

function enforceAcceptHeader(req: Request) {
  const accept = (req.header('accept') || '').toLowerCase();
  if (!accept.includes('application/json') && !accept.includes('text/event-stream')) {
    throw new HttpError(
      406,
      'Clients must include application/json or text/event-stream in the Accept header.',
    );
  }
}

function enforceJsonContent(req: Request) {
  const contentType = req.header('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }
}

function normalizeMessages(body: unknown): JSONRPCMessage[] {
  let payload = body;
  if (typeof body === 'string') {
    try {
      payload = JSON.parse(body);
    } catch {
      throw new HttpError(400, 'Invalid JSON body');
    }
  }

  if (Array.isArray(payload)) {
    return payload as JSONRPCMessage[];
  }

  if (payload && typeof payload === 'object') {
    return [payload as JSONRPCMessage];
  }

  throw new HttpError(400, 'Invalid JSON-RPC payload');
}

function partitionMessages(messages: JSONRPCMessage[]) {
  const requests: JSONRPCRequest[] = [];
  const notifications: JSONRPCNotification[] = [];
  const responses: JSONRPCResponse[] = [];

  for (const message of messages) {
    if (isRequest(message)) {
      requests.push(message);
    } else if (isNotification(message)) {
      notifications.push(message);
    } else {
      responses.push(message as JSONRPCResponse);
    }
  }

  return { requests, notifications, responses };
}

function isRequest(message: JSONRPCMessage): message is JSONRPCRequest {
  return typeof (message as JSONRPCRequest).method === 'string' && 'id' in message;
}

function isNotification(message: JSONRPCMessage): message is JSONRPCNotification {
  return typeof (message as JSONRPCNotification).method === 'string' && !('id' in message);
}

async function processNotifications(
  headerSessionId: string | undefined,
  notifications: JSONRPCNotification[],
) {
  if (notifications.length === 0) {
    return;
  }

  const sessionId = requireSessionHeader(headerSessionId);
  const session = loadSession(sessionId);

  for (const notification of notifications) {
    switch (notification.method) {
      case 'initialized':
        session.initialized = true;
        touchSession(session);
        logger.info(`Session ${session.id} marked as initialized`);
        break;
      case 'notifications/cancelled':
      case 'notifications/progress':
        touchSession(session);
        logger.debug(`Received ${notification.method} notification`, notification);
        break;
      default:
        logger.debug(`Unhandled notification: ${notification.method}`);
    }
  }
}

function logClientResponses(sessionId: string | undefined, responses: JSONRPCResponse[]) {
  if (responses.length === 0) {
    return;
  }
  const details = { sessionId, responses: responses.length };
  logger.debug('Received client responses (server does not issue requests)', details);
}

function openSseStream(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

function sendSseMessage(res: Response, message: JSONRPCResponse | JSONRPCError) {
  res.write(`data: ${JSON.stringify(message)}\n\n`);
}

async function handleRpcRequest(
  request: JSONRPCRequest,
  session: Session | undefined,
): Promise<{ result: Record<string, unknown>; newSessionId?: string }> {
  switch (request.method) {
    case 'initialize': {
      const newSession = createSession();
      const requestedVersion = request.params?.protocolVersion;
      const protocolVersion =
        typeof requestedVersion === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
          ? requestedVersion
          : LATEST_PROTOCOL_VERSION;

      const result = {
        protocolVersion,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'mcp-cerebra-legal-server',
          version: '2.0.0',
        },
      };

      return { result, newSessionId: newSession.id };
    }
    case 'ping': {
      const currentSession = ensureSession(session);
      touchSession(currentSession);
      return { result: {} };
    }
    case 'tools/list': {
      const currentSession = ensureSession(session);
      touchSession(currentSession);
      return { result: { tools: legalTools.listTools() } };
    }
    case 'tools/call': {
      const currentSession = ensureSession(session);
      touchSession(currentSession);

      const name = request.params?.name;
      if (typeof name !== 'string') {
        throw new RpcError(ErrorCode.InvalidParams, 'Tool name is required');
      }

      const args = request.params?.arguments;
      const toolResult = await legalTools.callTool(name, args);
      return { result: toolResult };
    }
    default:
      throw new RpcError(ErrorCode.MethodNotFound, `Unsupported method: ${request.method}`);
  }
}

function ensureSession(session: Session | undefined): Session {
  if (!session) {
    throw new RpcError(ErrorCode.InvalidRequest, 'Request requires an active session');
  }
  return session;
}

function createSession(): Session {
  const id = uuidv4();
  const now = Date.now();
  const session: Session = {
    id,
    createdAt: now,
    lastActivity: now,
    initialized: false,
  };
  sessions.set(id, session);
  logger.info(`Created session ${id}`);
  return session;
}

function requireSessionHeader(sessionId?: string): string {
  if (!sessionId) {
    throw new HttpError(400, 'Missing Mcp-Session-Id header');
  }
  return sessionId;
}

function loadSession(sessionId: string): Session {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new HttpError(404, 'Session not found');
  }
  return session;
}

function touchSession(session: Session) {
  session.lastActivity = Date.now();
}

function createErrorResponse(id: JSONRPCRequest['id'], error: unknown): JSONRPCError {
  if (error instanceof RpcError) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  logger.error('Unhandled RPC error', error as Error);
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: ErrorCode.InternalError,
      message: 'Internal server error',
    },
  };
}

function handleHttpError(res: Response, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  logger.error('Unhandled HTTP error', error as Error);
  res.status(500).json({ error: 'Internal server error' });
}
