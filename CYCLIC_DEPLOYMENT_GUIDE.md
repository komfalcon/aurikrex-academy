# Deployment Guide for Cyclic.sh

## Prerequisites

- GitHub account with this repository
- MongoDB Atlas account (already configured)
- Cyclic.sh account (free tier available)

## Step-by-Step Deployment

### 1. Prepare MongoDB Atlas

Your MongoDB Atlas is already configured:
- ✅ Connection URI: `mongodb+srv://moparaji57_db_user:...@cluster0.sknrqn8.mongodb.net/`
- ✅ Database: `aurikrex-academy`
- ✅ Collections will be created automatically on first run

### 2. Sign Up for Cyclic.sh

1. Go to [https://cyclic.sh](https://cyclic.sh)
2. Sign up using your GitHub account
3. Authorize Cyclic to access your repositories

### 3. Deploy Your Application

1. **Connect Repository:**
   - Click "Deploy" or "Link Your Own"
   - Select this repository: `komfalcon/aurikrex-academy`
   - Select branch: `copilot/prepare-backend-for-deployment`
   - Set root directory: `aurikrex-backend`

2. **Configure Environment Variables:**
   
   In Cyclic dashboard, go to "Variables" and add:

   ```
   Required Variables:
   -------------------
   MONGO_URI=mongodb+srv://moparaji57_db_user:AchNufUlCbfDBXdL@cluster0.sknrqn8.mongodb.net/?appName=Cluster0
   MONGO_DB_NAME=aurikrex-academy
   JWT_SECRET=change-this-to-a-strong-secret-min-32-characters-long
   OPENAI_API_KEY=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
   
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://your-frontend-domain.com
   
   Optional Variables:
   ------------------
   GEMINI_API_KEY=AIzaSyBTpOom9Sdsx17XLwbFzmsLiozRYq5vPf4
   ACCESS_TOKEN_EXPIRY=1h
   REFRESH_TOKEN_EXPIRY=7d
   
   EMAIL_HOST=smtp.titan.email
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=info@aurikrex.tech
   EMAIL_PASS=your-email-password
   ```

3. **Deploy:**
   - Click "Deploy" button
   - Cyclic will automatically detect `package.json`
   - Build process will run
   - Application will be deployed

### 4. Update package.json (if needed)

The current `package.json` should work, but verify these scripts exist:

```json
{
  "scripts": {
    "build": "npm run clean && tsc",
    "start": "node dist/server.mongo.js"
  }
}
```

**Note:** If you want to run without building (using ts-node), update to:

```json
{
  "scripts": {
    "start": "ts-node src/server.mongo.ts"
  }
}
```

### 5. Verify Deployment

Once deployed, Cyclic will provide a URL like:
`https://your-app-name.cyclic.app`

Test the deployment:

1. **Health Check:**
   ```bash
   curl https://your-app-name.cyclic.app/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "services": {
       "database": "connected"
     }
   }
   ```

2. **Register a Test User:**
   ```bash
   curl -X POST https://your-app-name.cyclic.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "password": "SecurePass123!",
       "role": "student"
     }'
   ```

3. **Login:**
   ```bash
   curl -X POST https://your-app-name.cyclic.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123!"
     }'
   ```

### 6. Configure CORS for Your Frontend

Once you know your frontend URL, update the `CORS_ORIGIN` environment variable in Cyclic:

```
CORS_ORIGIN=https://your-frontend-domain.com,https://another-domain.com
```

Multiple origins can be separated by commas.

### 7. Monitor Your Application

In Cyclic dashboard:
- **Logs:** View real-time application logs
- **Metrics:** Monitor memory and CPU usage
- **Deployments:** View deployment history

### 8. Troubleshooting

If deployment fails:

1. **Check Logs:**
   - In Cyclic dashboard, go to "Logs"
   - Look for error messages

2. **Common Issues:**
   - **MongoDB Connection Failed:** Verify MONGO_URI is correct
   - **Module Not Found:** Run `npm install` locally and commit package-lock.json
   - **Build Failed:** Check TypeScript errors with `npm run build`

3. **MongoDB Atlas Whitelist:**
   - Go to MongoDB Atlas dashboard
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` to allow all IPs (Cyclic uses dynamic IPs)

### 9. Update Frontend Configuration

Update your frontend to use the Cyclic backend URL:

```javascript
// frontend/src/config.ts
export const API_URL = 'https://your-app-name.cyclic.app/api';
```

### 10. Security Checklist

Before going live:

- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Update CORS_ORIGIN to your actual frontend domain
- [ ] Enable MongoDB Atlas IP whitelist (or use 0.0.0.0/0 for Cyclic)
- [ ] Review and update rate limits if needed
- [ ] Enable MongoDB Atlas backups
- [ ] Set up monitoring/alerts in Cyclic

## Advanced Configuration

### Custom Domain

1. In Cyclic dashboard, go to "Settings" → "Custom Domain"
2. Add your domain
3. Update DNS records as instructed
4. SSL certificate will be auto-generated

### Environment-Specific Configs

You can create different deployments for staging/production:

1. Create different branches (e.g., `staging`, `production`)
2. Deploy each branch separately in Cyclic
3. Use different environment variables for each

### Scaling

Cyclic auto-scales based on traffic. For better performance:

1. Enable caching (Redis) if needed
2. Optimize MongoDB queries with indexes (already done)
3. Monitor response times in Cyclic dashboard

## Cost Considerations

**Cyclic Free Tier:**
- 1000 hours/month (enough for small projects)
- Auto-sleep after inactivity (wakes on request)
- Custom domains included
- SSL certificates included

**MongoDB Atlas Free Tier (M0):**
- 512 MB storage
- Shared RAM
- Good for development/small production

## Support

- **Cyclic Docs:** [https://docs.cyclic.sh](https://docs.cyclic.sh)
- **MongoDB Atlas Docs:** [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Issues:** Check application logs in Cyclic dashboard

---

## Quick Deploy Checklist

- [ ] Sign up for Cyclic.sh
- [ ] Connect GitHub repository
- [ ] Set root directory to `aurikrex-backend`
- [ ] Add all environment variables
- [ ] Click Deploy
- [ ] Test /health endpoint
- [ ] Test /api/auth/signup
- [ ] Update frontend API URL
- [ ] Configure CORS
- [ ] Done! 🎉

**Deployment Time:** ~5-10 minutes

**Status:** Ready to deploy! Just follow the steps above.
