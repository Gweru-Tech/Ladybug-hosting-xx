# Deployment Guide

## Render.com Deployment

### Prerequisites
- GitHub repository with the project code
- Render.com account
- Discord Developer Application

### Step-by-Step Deployment

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Enable OAuth2 with `identify` and `email` scopes
   - Set redirect URL: `https://your-app-name.onrender.com/auth/discord/callback`

2. **Set Environment Variables in Render**
   ```
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_CALLBACK_URL=https://your-app-name.onrender.com/auth/discord/callback
   SESSION_SECRET=generate_random_secret_here
   NODE_ENV=production
   ```

3. **Deploy to Render**
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` configuration
   - Deploy will create both web service and database

4. **Verify Deployment**
   - Check the health endpoint: `https://your-app-name.onrender.com/health`
   - Test Discord OAuth flow
   - Verify database connectivity

### Manual Deployment

If not using the automatic `render.yaml` configuration:

1. **Web Service Configuration**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`
   - Auto-deploy: Yes

2. **PostgreSQL Database**
   - Create PostgreSQL instance
   - Get connection string
   - Add to environment variables as `DATABASE_URL`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_CLIENT_ID` | Discord app client ID | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | Discord app client secret | `abcdef1234567890` |
| `DISCORD_CALLBACK_URL` | OAuth callback URL | `https://app.onrender.com/auth/discord/callback` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | `random_string_here` |
| `NODE_ENV` | Environment | `production` |

### Troubleshooting

**Common Issues:**

1. **Discord OAuth Fails**
   - Check Discord application settings
   - Verify redirect URL matches exactly
   - Ensure OAuth scopes are correct

2. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Check database is online
   - Confirm SSL settings

3. **Application Won't Start**
   - Check logs in Render dashboard
   - Verify all environment variables are set
   - Ensure package.json is valid

4. **404 Errors**
   - Check if build completed successfully
   - Verify start command in package.json
   - Check health endpoint configuration

### Performance Optimization

1. **Enable Caching**
   - Set up Redis for session storage
   - Configure CDN for static assets

2. **Database Optimization**
   - Add indexes to frequently queried columns
   - Use connection pooling
   - Monitor query performance

3. **Monitoring**
   - Set up error reporting
   - Monitor resource usage
   - Set up alerts for downtime

### Scaling

When scaling your application:

1. **Horizontal Scaling**
   - Add multiple web instances
   - Use load balancer
   - Enable sticky sessions

2. **Database Scaling**
   - Consider read replicas
   - Optimize queries
   - Implement caching

3. **File Storage**
   - Use external storage (AWS S3)
   - Implement CDN for assets
   - Optimize file compression

## Local Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/your-repo/bot-hosting-platform.git
cd bot-hosting-platform
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Database Setup
```bash
# PostgreSQL
createdb bot_hosting

# Or use Docker
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Health: http://localhost:3000/health

## Production Best Practices

### Security
1. **Environment Variables**
   - Never commit secrets to Git
   - Use different secrets for production
   - Rotate keys regularly

2. **Database Security**
   - Use SSL connections
   - Implement proper access controls
   - Regular backups

3. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration

### Monitoring
1. **Application Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - Log aggregation

2. **Infrastructure Monitoring**
   - Server metrics
   - Database performance
   - Network latency

### Backups
1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery
   - Test restores regularly

2. **File Backups**
   - User uploads
   - Configuration files
   - Static assets

## Domain Configuration

### Custom Domain Setup
1. **DNS Configuration**
   ```
   A record: @ -> render-app-ip
   CNAME: www -> your-app.onrender.com
   ```

2. **SSL Certificate**
   - Automatic through Render
   - Or upload custom certificate

3. **Redirects**
   - HTTP to HTTPS
   - www to non-www
   - Custom redirect rules

## Maintenance

### Regular Tasks
1. **Updates**
   - Keep dependencies updated
   - Security patches
   - Node.js version updates

2. **Maintenance**
   - Database cleanup
   - Log rotation
   - Cache clearing

3. **Monitoring**
   - Check error logs
   - Monitor performance
   - Resource usage alerts

### Deployment Workflow

1. **Development**
   - Create feature branch
   - Test changes locally
   - Update documentation

2. **Staging**
   - Deploy to staging
   - Run integration tests
   - User acceptance testing

3. **Production**
   - Merge to main branch
   - Automatic deployment
   - Post-deployment verification

## Support

### Getting Help
- Check [Render Documentation](https://render.com/docs)
- Review error logs
- Contact Render support
- Check GitHub issues

### Community
- Discord server
- GitHub discussions
- Stack Overflow questions
- Developer forums

### Emergency Procedures
1. **Downtime**
   - Check Render status
   - Review recent deployments
   - Check database status

2. **Security Issues**
   - Rotate secrets immediately
   - Review access logs
   - Update dependencies

3. **Data Loss**
   - Restore from backup
   - Investigate cause
   - Implement prevention measures