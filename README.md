# MCP Cerebra Legal Server

Enterprise-grade HTTP/STDIO MCP server for legal reasoning and analysis with advanced citation management and EU legal database integration.

## 🌐 Deployment Ready

### HTTP Mode (NEW!)
- **Deploy to**: Vercel, Railway, Render, Docker
- **Protocol**: JSON-RPC over Server-Sent Events (SSE)  
- **Access**: HTTPS endpoints for non-technical users
- **Integration**: Direct URL configuration in Claude Desktop

### STDIO Mode  
- **Use case**: Local development, CLI tools
- **Protocol**: JSON-RPC over stdio
- **Performance**: Optimal for desktop applications

## 🚀 Features

### Core Legal Tools
- **`legal_think`** - Structured legal reasoning with domain-specific guidance
- **`legal_ask_followup_question`** - Intelligent follow-up questions for legal analysis  
- **`legal_attempt_completion`** - Professional legal document formatting
- **`legal_verify_with_api`** - Real-time verification against EU legal databases

### Advanced Capabilities  
- **Domain Detection** - Automatic identification of legal areas (ANSC, consumer protection, contracts)
- **Citation Management** - Professional citations with direct EUR-Lex links
- **EU Legal Integration** - Access to 138,911+ EU legal documents
- **Template Generation** - Domain-specific legal analysis templates
- **Quality Feedback** - AI-powered analysis quality assessment

## 🎯 Specialized Legal Domains

### ANSC Contestations
- Procurement law analysis with Law 131/2015 references
- Technical specification evaluation  
- Award criteria assessment
- ANSC precedent integration

### Consumer Protection
- Warranty and guarantee analysis
- Product safety compliance
- Consumer rights evaluation
- Burden of proof assessment

### Contract Analysis  
- Civil Code provision analysis
- Contractual clause evaluation
- Obligation and liability assessment
- Enforceability analysis

## 📚 EU Legal Database Access

Integrated with official EU legal sources:
- **EUR-Lex**: 138,911 documents (1951-2013)
- **PreLex**: 31,173 inter-institutional procedures (1969-2011)  
- **Council Voting**: 590 legislative acts (2006-2011)

## 🔗 Enhanced Citation System

### Auto-Generated Citations
```
Council Directive 2004/18/EC of 31 March 2004 (on the coordination of procedures for the award of public works contracts) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0018)
```

### Inline References  
- Automatic [1], [2], [3] numbering
- Professional citation lists
- Direct links to legal sources
- CELEX number integration

## 🛠 Installation & Setup

```bash
git clone https://github.com/your-org/mcp-cerebra-legal-server
cd mcp-cerebra-legal-server  
npm install
npm run build
```

## 🚀 Running the Server

### HTTP Mode (Recommended for Deployment)
```bash
# Development
npm run dev

# Production  
npm run start:http
# Server runs on http://localhost:3000
```

### STDIO Mode (Local CLI)
```bash
npm run start:stdio
```

### Auto-Detection
```bash
npm start  # Defaults to HTTP mode
MCP_MODE=stdio npm start  # Forces STDIO mode
```

## 🌐 Deployment Options

### 1. Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```
Your server: `https://your-deployment.vercel.app/sse`

### 2. Railway
```bash  
npm i -g @railway/cli
railway login && railway up
```

### 3. Docker
```bash
docker build -t mcp-legal-server .
docker run -p 3000:3000 mcp-legal-server
```

### 4. One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/mcp-cerebra-legal-server)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## ⚙️ Configuration

### For HTTP Deployment (Non-Technical Users)
```json
{
  "mcpServers": {
    "cerebra-legal": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-everything"],
      "env": {
        "MCP_SERVER_URL": "https://your-deployment.vercel.app/sse"
      }
    }
  }
}
```

### For Local STDIO Mode
```json
{
  "mcpServers": {
    "cerebra-legal": {
      "command": "node",
      "args": ["/path/to/mcp-cerebra-legal-server/build/stdio-server.js"]
    }
  }
}
```

## 📖 Tool Usage Examples

### Legal Reasoning
```json
{
  "tool": "legal_think",
  "arguments": {
    "thought": "Analyzing ANSC contestation regarding restrictive technical specifications",
    "thoughtNumber": 1,
    "totalThoughts": 3,
    "nextThoughtNeeded": true,
    "requestTemplate": true
  }
}
```

### EU Legal Verification
```json  
{
  "tool": "legal_verify_with_api",
  "arguments": {
    "query": "EU procurement directive technical specifications",
    "verificationScope": "eurlex",
    "maxResults": 10,
    "includeAnalysis": true
  }
}
```

## 📡 HTTP API Endpoints

Once deployed, your server exposes:

- **`GET /`** - Server information and documentation  
- **`GET /health`** - Health check endpoint
- **`GET /tools`** - List available tools
- **`GET /sse`** - Server-Sent Events endpoint for MCP protocol

### Testing Your Deployment
```bash
curl https://your-deployment.vercel.app/health
curl https://your-deployment.vercel.app/tools  
```

## 🏗 Architecture

```
src/
├── index.ts                 # Main entry point (mode detection)
├── http-server.ts           # HTTP/SSE server for deployment  
├── stdio-server.ts          # STDIO server for local use
├── shared/                  # Shared utilities
│   ├── CitationFormatter.ts # Citation generation & linking
│   ├── DomainDetector.ts    # Legal domain identification  
│   ├── LegalKnowledgeBase.ts# Templates & guidance
│   ├── EULegalAPIClient.ts  # EU database integration
│   └── types.ts             # Type definitions
├── tools/                   # Legal reasoning tools
│   ├── LegalThinkTool.ts    # Structured reasoning
│   ├── LegalVerifyWithAPITool.ts # EU database verification
│   └── ...                  # Other specialized tools
└── utils/                   # Utilities
    └── logger.ts            # Logging system
```

## 🔧 Environment Variables

- **`PORT`** - Server port (default: 3000)
- **`NODE_ENV`** - Environment (development/production) 
- **`MCP_MODE`** - Server mode (http/stdio)
- **`LOG_LEVEL`** - Logging level (info/debug/error)

## 🔒 Security Features

- **CORS Configuration** - Configurable origin restrictions
- **Rate Limiting** - Built-in request throttling  
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Graceful error responses
- **Health Monitoring** - Built-in health checks

## 📊 Monitoring & Observability

- **Health Endpoint** - `/health` for uptime monitoring
- **Request Logging** - Structured logging for all requests
- **Error Tracking** - Comprehensive error reporting  
- **Performance Metrics** - Built-in timing and memory tracking

## 🔍 Citation Examples

The server generates professional legal citations with direct EUR-Lex links:

```markdown
## Relevant EU Legal Sources

1. Council Directive 2004/18/EC of 31 March 2004 (on the coordination of procedures for the award of public works contracts) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004L0018)

2. Commission Regulation (EU) No 1234/2009 of 15 December 2009 (concerning the application of Articles 87 and 88 of the EC Treaty to aid in the form of guarantees) [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1234)
```

See [CITATION_EXAMPLES.md](./CITATION_EXAMPLES.md) for more examples.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙋‍♂️ Support

For support and questions:
- Create an issue on GitHub  
- Documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Citation Examples: [CITATION_EXAMPLES.md](./CITATION_EXAMPLES.md)

---

**Built for legal professionals who demand accuracy, efficiency, and proper source attribution.**

🌐 **Deploy once, use everywhere** - Perfect for teams and non-technical users!