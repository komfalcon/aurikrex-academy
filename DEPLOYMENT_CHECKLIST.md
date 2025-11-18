# Deployment Checklist for Aurikrex Academy

## Pre-Deployment Checks

### Backend (Render)

- [ ] MongoDB Atlas IP whitelist is configured
  - Add `0.0.0.0/0` to allow all IPs (for Render dynamic IPs)
  - Or add specific Render IP ranges if known
  
- [ ] Environment variables are set in Render dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `HOST=0.0.0.0` (or leave default)
  - [ ] `ALLOWED_ORIGINS` (comma-separated list including Vercel frontend URL)
  - [ ] `MONGO_URI` (MongoDB Atlas connection string)
  - [ ] `MONGO_DB_NAME=aurikrex-academy`
  - [ ] `OPENAI_API_KEY`
  - [ ] `GEMINI_API_KEY` (optional)
  - [ ] `JWT_SECRET` (minimum 32 characters, cryptographically random)
  - [ ] `ACCESS_TOKEN_EXPIRY=1h`
  - [ ] `REFRESH_TOKEN_EXPIRY=7d`
  - [ ] `EMAIL_HOST` (SMTP server)
  - [ ] `EMAIL_PORT` (465 or 587)
  - [ ] `EMAIL_SECURE` (true for port 465, false for 587)
  - [ ] `EMAIL_USER`
  - [ ] `EMAIL_PASS`
  - [ ] `LOG_LEVEL=info` (production)
  - [ ] `RATE_LIMIT_WINDOW=900000` (optional)
  - [ ] `RATE_LIMIT_MAX=100` (optional)

- [ ] Build command configured: `npm install && npm run build`
- [ ] Start command configured: `npm start`
- [ ] Node version set to 20.x
- [ ] Health check endpoint configured: `/health`

### Frontend (Vercel)

- [ ] Environment variables are set in Vercel dashboard:
  - [ ] `VITE_API_URL` (Your Render backend URL + `/api`, e.g., `https://your-app.onrender.com/api`)

- [ ] Build settings configured:
  - [ ] Framework Preset: `Vite`
  - [ ] Root Directory: `aurikrex-frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm install`

- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified (automatic with Vercel)

### MongoDB Atlas

- [ ] Database user created with appropriate permissions
- [ ] Network access configured (allow Render IPs or 0.0.0.0/0)
- [ ] Connection string tested and working
- [ ] Indexes created (automatically on first backend startup)
- [ ] Backup strategy configured (Atlas automatic backups)

## Deployment Steps

### 1. Backend Deployment (Render)

1. Push code to GitHub repository
2. Connect GitHub repository to Render
3. Create new Web Service
4. Configure service settings:
   - Name: `aurikrex-backend` (or your choice)
   - Region: Choose closest to your users
   - Branch: `main` (or your deployment branch)
   - Root Directory: `aurikrex-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add all environment variables
6. Deploy service
7. Wait for deployment to complete
8. Test health endpoint: `https://your-app.onrender.com/health`
9. Note the service URL for frontend configuration

### 2. Frontend Deployment (Vercel)

1. Push code to GitHub repository (if not already)
2. Connect GitHub repository to Vercel
3. Import project and configure:
   - Framework Preset: `Vite`
   - Root Directory: `aurikrex-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = Your Render backend URL + `/api`
5. Deploy
6. Wait for deployment to complete
7. Test the application

### 3. Post-Deployment Verification

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads successfully
- [ ] User signup works
- [ ] OTP email is received
- [ ] Email verification works
- [ ] User login works
- [ ] Dashboard loads with user data
- [ ] Lesson generation works
- [ ] Analytics tracking works
- [ ] JWT token refresh works
- [ ] Logout works correctly

## Testing Checklist

### Authentication Flow
- [ ] Navigate to signup page
- [ ] Fill in all required fields with valid data
- [ ] Submit form - should receive success message
- [ ] Check email for OTP
- [ ] Enter OTP on verification page
- [ ] Should redirect to dashboard after successful verification
- [ ] Try login with same credentials
- [ ] Should successfully login and reach dashboard

### Lesson Generation
- [ ] Navigate to lesson generation page
- [ ] Fill in lesson parameters
- [ ] Submit generation request
- [ ] Wait for AI to generate lesson
- [ ] Verify lesson content is displayed
- [ ] Check lesson is saved to database

### Dashboard
- [ ] Verify user profile information displays correctly
- [ ] Check progress statistics are shown
- [ ] Verify recent activity is tracked
- [ ] Test navigation between different sections

### Error Scenarios
- [ ] Try signup with existing email - should show error
- [ ] Try login with wrong password - should show error
- [ ] Try accessing protected route without auth - should redirect to login
- [ ] Try expired JWT token - should prompt for refresh or re-login
- [ ] Try invalid OTP - should show error message

## Security Verification

- [ ] JWT_SECRET is cryptographically random and at least 32 characters
- [ ] All API keys are stored in environment variables (never in code)
- [ ] CORS is configured to only allow your frontend domain
- [ ] Rate limiting is active (test with multiple rapid requests)
- [ ] Password requirements are enforced (min length, complexity)
- [ ] OTP expires after 10 minutes
- [ ] Tokens expire as configured (1h for access, 7d for refresh)
- [ ] HTTPS is enforced on all endpoints
- [ ] MongoDB credentials are not exposed in logs

## Performance Checks

- [ ] Frontend loads in under 3 seconds
- [ ] API responses are under 500ms (excluding AI generation)
- [ ] Images and assets are properly cached
- [ ] Database queries use indexes
- [ ] No memory leaks in backend
- [ ] Frontend bundle size is optimized

## Monitoring Setup

### Render
- [ ] Enable logging
- [ ] Set up alerts for service downtime
- [ ] Configure metrics tracking
- [ ] Set up automatic restarts on failure

### Vercel
- [ ] Enable analytics
- [ ] Set up error tracking
- [ ] Configure deployment notifications
- [ ] Review build performance

### MongoDB Atlas
- [ ] Set up performance alerts
- [ ] Configure backup notifications
- [ ] Enable query profiling (temporarily, for optimization)
- [ ] Set up disk space alerts

## Rollback Plan

If issues are found after deployment:

### Backend (Render)
1. Navigate to Render dashboard
2. Go to your service
3. Click on "Rollback" button
4. Select previous working deployment
5. Confirm rollback

### Frontend (Vercel)
1. Navigate to Vercel dashboard
2. Go to your project
3. Find previous working deployment
4. Click "Promote to Production"

### Database
- MongoDB Atlas provides point-in-time recovery
- Contact Atlas support if needed for recovery

## Common Issues and Solutions

### Backend won't start
- Check Render logs for error messages
- Verify all environment variables are set correctly
- Test MongoDB connection from Render IP
- Check if MongoDB Atlas network access allows Render IPs

### Frontend can't connect to backend
- Verify VITE_API_URL is correct and includes `/api`
- Check CORS settings in backend
- Verify backend is actually running (test health endpoint)
- Check browser console for specific error messages

### OTP emails not sending
- Verify SMTP credentials are correct
- Check email service logs in Render
- Test SMTP connection separately
- Verify EMAIL_SECURE setting matches port (true for 465, false for 587)

### Database connection timeouts
- Check MongoDB Atlas network access settings
- Add 0.0.0.0/0 to IP whitelist (for testing)
- Verify connection string is correct
- Check if database cluster is running

## Post-Deployment Optimization

After successful deployment and verification:

- [ ] Set up CDN for static assets (if needed)
- [ ] Configure custom domain with SSL
- [ ] Set up monitoring and alerting
- [ ] Implement error tracking (e.g., Sentry)
- [ ] Set up database backups schedule
- [ ] Configure automatic scaling rules
- [ ] Optimize bundle sizes
- [ ] Enable compression
- [ ] Set up staging environment
- [ ] Document production runbook

## Maintenance

Regular tasks to perform:

### Weekly
- [ ] Review error logs
- [ ] Check API performance metrics
- [ ] Monitor database size and growth
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies (with testing)
- [ ] Review and optimize slow database queries
- [ ] Check for security vulnerabilities
- [ ] Review and update rate limits if needed
- [ ] Backup verification test

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost optimization review
- [ ] Disaster recovery drill

---

## Support Contacts

- **MongoDB Atlas Support**: https://support.mongodb.com/
- **Render Support**: https://render.com/docs/support
- **Vercel Support**: https://vercel.com/support
- **OpenAI Support**: https://help.openai.com/

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
