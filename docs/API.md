# API Documentation

## Authentication

All API endpoints (except authentication endpoints) require Discord OAuth authentication.

### OAuth Flow
1. Redirect users to `/auth/discord`
2. Discord redirects to `/auth/discord/callback`
3. Server creates session and redirects to `/panel`

### Session Management
- Sessions are stored server-side
- Cookies are encrypted and secure
- Session timeout: 7 days

## Endpoints

### Authentication

#### GET /auth/discord
Initiates Discord OAuth authentication flow.

**Query Parameters:**
- `redirect` (optional): URL to redirect after login

**Response:**
```http
302 Found
Location: https://discord.com/oauth2/authorize?...
```

#### GET /auth/discord/callback
OAuth callback endpoint. Handles Discord's response and creates session.

**Query Parameters:**
- `code`: Authorization code from Discord
- `state`: CSRF protection state

#### GET /logout
Logs out the current user and clears session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management

#### GET /api/user
Get current authenticated user information.

**Authentication:** Required

**Response:**
```json
{
  "id": "123456789",
  "username": "User#1234",
  "email": "user@example.com",
  "avatar": "hash",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### PUT /api/user
Update user profile information.

**Authentication:** Required

**Request Body:**
```json
{
  "username": "NewUsername",
  "email": "new@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123456789",
    "username": "NewUsername",
    "email": "new@example.com"
  }
}
```

### Bot Management

#### GET /api/bots
Get all bots for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (`running` | `stopped`)
- `runtime` (optional): Filter by runtime (`nodejs` | `python` | `java` | `deno` | `lua`)
- `limit` (optional): Number of results to return
- `offset` (optional): Number of results to skip

**Response:**
```json
{
  "bots": [
    {
      "id": 1,
      "name": "My Bot",
      "description": "A cool Discord bot",
      "runtime": "nodejs",
      "status": "running",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00.txt",
      "project_files": {
        "index.js": "console.log('Hello World');"
      },
      "environment_vars": {
        "DISCORD_TOKEN": "your_token_here"
      }
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### GET /api/bots/:id
Get details of a specific bot.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Response:**
```json
{
  "id": 1,
  "name": "My Bot",
  "description": "A cool Discord bot",
  "runtime": "nodejs",
  "status": "running",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01:00:00Z",
  "project_files": {
    "index.js": "console.log('Hello World');",
    "package.json": "{...}"
  },
  "environment_vars": {
    "DISCORD_TOKEN": "your_token_here"
  },
  "logs": [
    {
      "timestamp": "2023-01-01T00:00:00Z",
      "level": "info",
      "message": "Bot started successfully"
    }
  ]
}
```

#### POST /api/bots
Create a new bot.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My New Bot",
  "description": "Description of my bot",
  "runtime": "nodejs",
  "environment_vars": {
    "DISCORD_TOKEN": "your_token_here"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "name": "My New Bot",
  "description": "Description of my bot",
  "runtime": "nodejs",
  "status": "stopped",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01:00:00:00Z",
  "environment_vars": {
    "DISCORD_TOKEN": "your_token_here"
  }
}
```

#### PUT /api/bots/:id
Update an existing bot.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Request Body:**
```json{
  "name": "Updated Bot Name",
  "description": "Updated description",
  "environment_vars": {
    "DISCORD_TOKEN": "new_token",
    "NEW_VAR": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "bot": {
    "id": 1,
    "name": "Updated Bot Name",
    "description": "Updated description",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/bots/:id
Delete a bot and all its data.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Response:**
```json
{
  "success": true,
  "message": "Bot deleted successfully"
}
```

### Bot Operations

#### POST /api/bots/:id/start
Start a bot instance.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Response:**
```json
{
  "success": true,
  "status": "running",
  "message": "Bot started successfully"
}
```

#### POST /api/bots/:id/stop
Stop a running bot.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Response:**
`````json
{
  "success": true,
  "status": "stopped",
  "message": "Bot stopped successfully"
}
```

#### POST /api/bots/:id/restart
Restart a bot.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Response:**
```json
{
  "success": true,
  "status": "running",
  "message": "Bot restarted successfully"
}
```

#### POST /api/bots/:id/logs
Get bot logs.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Query Parameters:**
- `lines` (optional): Number of log lines to return (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2023-01-01T00:00:00:00Z",
      "level": "info",
      "message": "Bot started"
    },
    {
      "timestamp": "2023-01-01T00:00:01Z",
      "level": "error",
      "message": "Connection failed"
    }
  ]
}
```

### File Management

#### GET /api/bots/:id/files
Get list of bot project files.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Response:**
```json
```

#### GET /api/bots/:id/files/:filename
Get contents of a specific file.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID
- `filename`: Name of file

**Response:**
```http
200 OK
Content-Type: text/plain

console.log('Hello World');
```

#### POST /api/bots/:id/files/:filename
Update or create a bot file.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID
-:**
```http
Content-Type: text/plain

console.log('Hello World Updated');
```

**Response:**
```json
{
  "success": true,
  "message": "File saved successfully"
}
```

#### DELETE /api/bots/:id/files/:filename
Delete a bot file.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID
- `filename`: Name of file

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### POST /api/bots/:id/files/upload
Upload multiple files to bot project.

**Authentication:** Required

**Path Parameters:**
- `id`: Bot ID

**Request:** `multipart/form-data`

**Response:**
```json
{
  "success": true,
  "files": [
    "index.js",
    "package.json",
    "README.md"
  ]
}
```

### System Information

#### GET /api/system/info
Get system information.

**Authentication:** Admin required

**Response:**
```json
{
  "server": {
    "uptime": 86400,
    "memory": {
      "total": 2048,
      "used": 1024,
      "free": 1024
    },
    "cpu": {
      "usage": 12.5,
      "cores": 4
    }
  },
  "database": {
    "connected": true,
    "users": 1000,
    "bots": 500
  }
}
```

#### GET /api/system/stats
Get system statistics.

**Authentication:** Admin required

**Response:**
```json
{
  "users": {
    "total": 1000,
    "active": 750,
    "new_today": 25
  },
  "bots": {
    "total": 500,
    "running": 300,
    "stopped": 200
  },
  "resources": {
    "cpu_usage": 12.5,
    "memory_usage": 50.0,
    "storage_used": "2.5GB"
  }
}
```

## Error Handling

### Error Response Format

All errors return a consistent format:

```json
{
  "error": {
    "code": "BOT_NOT_FOUND",
    "message": "Bot with ID 1 not found",
    "details": "The requested bot does not exist or you don't have permission to access it."
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 204 | No Content | Resource deleted successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | User must be authenticated |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have required permissions |
| `BOT_NOT_FOUND` | Bot with specified ID not found |
| `BOT_ALREADY_RUNNING` | Bot is already running |
| `BOT_NOT_RUNNING` | Bot is not running |
| `INVALID_RUNTIME` | Invalid bot runtime specified |
| `FILE_NOT_FOUND` | Specified file not found |
| `QUOTA_EXCEEDED` | User quota exceeded |
| `VALIDATION_ERROR` | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |

## Rate Limiting

### Endpoints Rate Limits

- **Authentication endpoints**: 10 requests per minute
- **Bot operations**: 60 requests per minute
- **File operations**: 120 requests per minute
- **System info**: 30 requests per minute

### Headers

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1672531200
```

## Webhooks

### Bot Status Webhooks

Receive notifications when bot status changes:

#### POST /api/webhooks/bot-status
Register webhook for bot status changes.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["bot.started", "bot.stopped", "bot.error"],
  "bot_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "webhook_id": "webhook_123456"
}
```

**Webhook Payload:**
```json
{
  "event": "bot.started",
  "bot": {
    "id": 1,
    "name": "My Bot",
    "status": "running"
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
// Initialize client
const BotHosting = require('bot-hosting-sdk');
const client = new BotHosting({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-app.onrender.com'
});

// Get bots
const bots = await client.bots.list();
console.log('Your bots:', bots);

// Create a bot
const bot = await client.bots.create({
  name: 'My Bot',
  runtime: 'nodejs',
  environment_vars: {
    DISCORD_TOKEN: 'your_token'
  }
});

// Start the bot
await client.bots.start(bot.id);
```

### Python

```python
import bot_hosting

# Initialize client
client = bot_hosting.Client(
    api_key='your-api-key',
    base_url='https://your-app.onrender.com'
)

# Get bots
bots = client.bots.list()
print(f"Your bots: {bots}")

# Create a bot
bot = client.bots.create(
    name='My Bot',
    runtime='nodejs',
    environment_vars={
        'DISCORD_TOKEN': 'your_token'
    }
)

# Start the bot
client.bots.start(bot.id)
```

## Testing

### Authentication

For testing without Discord OAuth:

```bash
# Create test session
curl -X POST /api/test/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123456789"}'
```

### Mock Data

Development server includes mock data endpoints:

```bash
# Create test bots
curl -X POST /api/test/bots \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

## Changelog

### v1.0.0
- Initial API release
- Basic bot management
- Discord OAuth authentication
- Real-time status updates

### v1.1.0
- File management endpoints
- Webhook support
- Advanced filtering
- Rate limiting

### v1.2.0
- System monitoring
- Admin endpoints
- Bulk operations
- Enhanced error handling