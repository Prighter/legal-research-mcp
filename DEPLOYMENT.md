# MCP Cerebra Legal Server - Deployment Guide

This guide covers deploying the MCP Cerebra Legal Server to various platforms for HTTP/HTTPS access.

## 🌐 HTTP vs STDIO Modes

### STDIO Mode (Local)
- **Use case**: Local development, CLI tools, desktop apps
- **Protocol**: JSON-RPC over stdio
- **Start command**: `npm run start:stdio`

### HTTP Mode (Deployment)
- **Use case**: Web deployment, cloud platforms, remote access
- **Protocol**: JSON-RPC over Server-Sent Events (SSE)
- **Start command**: `npm run start:http`
- **Default port**: 3000

## 🚀 Deployment Options

### 1. Vercel (Recommended for Free Tier)

**Pros**: Free tier, easy setup, automatic HTTPS, global CDN
**Cons**: Function timeout limits (30s), cold starts

#### Deploy to Vercel:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Your MCP server will be available at**:
   ```
   https://your-deployment.vercel.app/sse
   ```

#### Manual Vercel Setup:
1. Push code to GitHub
2. Connect repository to Vercel
3. Vercel will automatically detect the configuration
4. Deploy!

### 2. Railway

**Pros**: Better for long-running processes, more generous limits
**Cons**: Paid service (but affordable)

#### Deploy to Railway:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   railway link
   railway up
   ```

3. **Set custom domain** (optional):
   ```bash
   railway domain
   ```

### 3. Render

**Pros**: Free tier available, good for persistent connections
**Cons**: Free tier has limitations

#### Deploy to Render:
1. Connect your GitHub repository to Render
2. Create a new "Web Service"
3. Use these settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:http`
   - **Environment**: `Node`

### 4. Docker Deployment

For self-hosting on your own servers:

#### Build and run:
```bash
# Build the project
npm run build

# Build Docker image
docker build -t mcp-cerebra-legal-server .

# Run container
docker run -p 3000:3000 \
  --name mcp-legal-server \
  --restart unless-stopped \
  -d mcp-cerebra-legal-server
```

#### Docker Compose:
```yaml
version: '3.8'
services:
  mcp-legal-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_MODE=http
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 5. AWS/GCP/Azure

Deploy using their container services or serverless functions with the provided Docker configuration.

## 🔧 Configuration for Claude Desktop

Once deployed, users can add your MCP server to their Claude Desktop configuration:

### For Vercel deployment:
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

### Direct SSE connection:
```json
{
  "mcpServers": {
    "cerebra-legal": {
      "command": "mcp-client",
      "args": ["--sse", "https://your-deployment.vercel.app/sse"]
    }
  }
}
```

## 📡 API Endpoints

Once deployed, your server exposes these endpoints:

- **`GET /`** - Server information and documentation
- **`GET /health`** - Health check endpoint
- **`GET /tools`** - List available tools
- **`GET /sse`** - Server-Sent Events endpoint for MCP protocol

## 🔍 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-deployment.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "mcp-cerebra-legal-server", 
  "version": "2.0.0",
  "timestamp": "2024-11-11T..."
}
```

### 2. Tools List
```bash
curl https://your-deployment.vercel.app/tools
```

### 3. MCP Protocol Test
Use any MCP client to connect to:
```
https://your-deployment.vercel.app/sse
```

## 🛠 Environment Variables

Set these environment variables for production:

- **`PORT`** - Server port (default: 3000)
- **`NODE_ENV`** - Set to "production"
- **`MCP_MODE`** - Set to "http" for HTTP mode
- **`LOG_LEVEL`** - Set logging level (info, debug, error)

## 🔒 Security Considerations

### CORS Configuration
The server is configured with permissive CORS for development. For production, consider:

```javascript
app.use(cors({
  origin: ['https://claude.ai', 'https://your-allowed-domain.com'],
  credentials: true
}));
```

### Rate Limiting
Consider adding rate limiting for production:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/sse', limiter);
```

### API Keys
For private deployment, you might want to add API key authentication:

```javascript
app.use('/sse', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## 📊 Monitoring

### Basic Health Monitoring
The `/health` endpoint provides basic server status. For production, consider:

- **Uptime monitoring** (UptimeRobot, Pingdom)
- **Log aggregation** (LogTail, DataDog)
- **Performance monitoring** (New Relic, Sentry)

### Example monitoring setup:
```javascript
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

## 🚨 Troubleshooting

### Common Issues:

1. **SSE Connection Fails**
   - Check CORS configuration
   - Verify the deployment URL
   - Check server logs for errors

2. **Tool Execution Timeouts**
   - Vercel has 30s function timeout
   - Consider Railway or self-hosting for longer processes

3. **Memory Issues**
   - Monitor memory usage
   - Consider increasing container limits
   - Optimize legal database queries

### Debug Mode:
Set `LOG_LEVEL=debug` to get verbose logging:

```bash
export LOG_LEVEL=debug
npm run start:http
```

## 📈 Scaling Considerations

- **Horizontal Scaling**: Deploy multiple instances behind a load balancer
- **Caching**: Implement Redis caching for legal API responses  
- **Database**: Consider PostgreSQL for storing legal analysis history
- **CDN**: Use CloudFlare or similar for static assets

Your MCP server is now ready for production deployment! 🎉