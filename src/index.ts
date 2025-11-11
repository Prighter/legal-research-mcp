#!/usr/bin/env node

/**
 * MCP Cerebra Legal Server - Main Entry Point
 * 
 * This server can run in two modes:
 * 1. HTTP mode (default) - for deployment on Vercel, Railway, etc.
 * 2. STDIO mode - for local CLI usage
 * 
 * Mode is determined by environment variables or command line arguments
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine run mode
const mode = process.env.MCP_MODE || process.argv[2] || 'http';

console.log(`🚀 Starting MCP Cerebra Legal Server in ${mode.toUpperCase()} mode...`);

try {
  if (mode === 'stdio' || mode === 'cli') {
    // Run STDIO server
    await import('./stdio-server.js');
    console.log('📡 STDIO server loaded successfully');
  } else {
    // Run HTTP server (default)
    await import('./http-server.js');
    console.log('🌐 HTTP server loaded successfully');
  }
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}