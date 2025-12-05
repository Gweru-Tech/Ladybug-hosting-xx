# Bot Hosting Platform - Discord Bot Hosting Service

A complete Discord bot hosting platform clone similar to bot-hosting.net, built with Node.js and deployable on Render.com.

## Features

- 🤖 **Multi-Runtime Support**: Host Discord bots written in Node.js, Python, Java, Deno, and Lua
- 🔐 **Discord OAuth Authentication**: Secure login using Discord accounts
- 📊 **Real-time Dashboard**: Monitor bot status with live updates via Socket.IO
- 💾 **PostgreSQL Database**: Scalable data storage for users and bots
- 🚀 **Easy Deployment**: One-click deployment on Render.com
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- ⚡ **Real-time Updates**: Live bot status updates and notifications
- 🎨 **Modern UI/UX**: Clean, professional interface inspired by bot-hosting.net

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: EJS templates, Tailwind CSS, Font Awesome
- **Database**: PostgreSQL
- **Authentication**: Passport.js with Discord OAuth
- **Deployment**: Render.com
- **Real-time**: Socket.IO for live updates

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Discord Application (for OAuth)

### Local Development

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd bot-hosting-platform
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - Discord Client ID and Secret
   - Database URL
   - Session Secret

3. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Add a bot to the application
   - Enable OAuth2 with `identify` and `email` scopes
   - Set redirect URL to `http://localhost:3000/auth/discord/callback`

4. **Start the Application**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## Deployment on Render.com

### Automatic Deployment

1. **Push to GitHub**
   - Push your code to a GitHub repository

2. **Create Render Account**
   - Sign up at [render.com](https://render.com)

3. **Connect Repository**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use the provided `render.yaml` configuration

4. **Configure Environment Variables**
   - Set your Discord Client ID and Secret
   - The database will be automatically created

5. **Deploy**
   - Render will automatically build and deploy your application

### Manual Deployment Setup

1. **Web Service**
   ```yaml
   service: web
   name: bot-hosting-platform
   env: node
   buildCommand: npm install
   startCommand: npm start
   ```

2. **Database**
   - Add PostgreSQL database service
   - Get connection string and set as `DATABASE_URL`

3. **Environment Variables**
   - `DISCORD_CLIENT_ID`: Your Discord application client ID
   - `DISCORD_CLIENT_SECRET`: Your Discord application client secret
   - `DISCORD_CALLBACK_URL`: `https://your-app.onrender.com/auth/discord/callback`
   - `SESSION_SECRET`: Generate a random secret key

## API Endpoints

### Authentication
- `GET /auth/discord` - Initiate Discord OAuth login
- `GET /auth/discord/callback` - Discord OAuth callback
- `GET /logout` - Logout user

### Bot Management
- `GET /api/bots` - Get user's bots
- `POST /api/bots` - Create new bot
- `POST /api/bots/:id/start` - Start bot
- `POST /api/bots/:id/stop` - Stop bot

### Web Pages
- `GET /` - Landing page
- `GET /panel` - User dashboard (requires authentication)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(255),
    access_token VARCHAR(255),
    refresh_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bots Table
```sql
CREATE TABLE bots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    runtime VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'stopped',
    project_files JSONB,
    environment_vars JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration

### Discord Application Setup

1. **Create Discord Application**
   - Visit [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Enter application name

2. **Configure OAuth2**
   - Go to "OAuth2" → "General"
   - Add redirect URL: `http://localhost:3000/auth/discord/callback` (development) or `https://your-domain.com/auth/discord/callback` (production)
   - Scopes: `identify`, `email`

3. **Get Credentials**
   - Go to "OAuth2" → "General"
   - Copy Client ID and Client Secret

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_CLIENT_ID` | Discord application client ID | Yes |
| `DISCORD_CLIENT_SECRET` | Discord application client secret | Yes |
| `DISCORD_CALLBACK_URL` | OAuth callback URL | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (defaults to 3000) |

## Features Overview

### Landing Page
- Hero section with call-to-action
- Supported runtimes showcase
- Features and benefits
- Trust indicators and testimonials
- Responsive design

### User Dashboard
- Bot statistics overview
- Real-time bot status updates
- Create new bot modal
- Bot management cards with actions
- File upload and management (coming soon)

### Bot Management
- Start/stop bots with one click
- Real-time status updates via Socket.IO
- Support for multiple programming languages
- Environment variable management
- File upload and editing capabilities

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Build CSS (if using Tailwind)
npm run build:css

# Watch CSS changes
npm run build:css -- --watch
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Considerations

- All routes are protected with Discord OAuth
- Session management with secure cookies
- Database queries use parameterized statements
- Environment variables for sensitive data
- CSRF protection for form submissions

## Support

- 📖 [Documentation](https://wiki.bot-hosting.net)
- 💬 [Discord Community](https://discord.gg/6FKKj4qEM6)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] File upload and editor
- [ ] Bot logs and monitoring
- [ ] Multi-instance support
- [ ] Admin panel
- [ ] Usage analytics
- [ ] Custom domains
- [ ] API rate limiting
- [ ] Bot templates
- [ ] Git integration
- [ ] Container support

---

⭐ If you find this project helpful, please give it a star!