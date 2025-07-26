# Render Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Build Failures

#### Frontend build fails
- Check Node.js version compatibility
- Verify dependencies in `package.json`
- Clear Render cache and rebuild

#### Backend build fails
- Check dependencies in `requirements.txt`
- Verify Python version in `runtime.txt`
- Check build command in `render.yaml`

### 2. Runtime Errors

#### Application crashes after starting
- Check MongoDB connection string
- Verify MongoDB Atlas configuration
- Check IP whitelist in MongoDB Atlas

#### Blank page or 404 error
- Verify static files are served correctly
- Check frontend build completion
- Verify backend server configuration

### 3. Database Connection Issues

#### Cannot connect to MongoDB Atlas
- Verify connection string
- Check user permissions
- Ensure cluster is active
- Check free tier limitations

### 4. Environment Variable Problems

#### Environment variables not recognized
- Check variables in Render dashboard
- Verify variable names
- Ensure proper loading in application

## Getting Help

If issues persist:
1. Check Render logs
2. Review [Render documentation](https://render.com/docs)
3. Search project issues
4. Contact Render support

## Useful Commands

```bash
# Test build locally
./build.sh

# Test application locally
cd backend && python server.py

# Debug environment variables (add to server.py)
import os
print("Environment variables:", os.environ)
```