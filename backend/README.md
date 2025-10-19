# MRMS Radar Proxy Backend

This backend service proxies requests to NOAA's MRMS data to bypass CORS restrictions.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the server:
```bash
npm start
```

The server will run on port 3001 by default.

## Deploying to Render (Free Tier)

1. Push this backend folder to a GitHub repository
2. Go to [render.com](https://render.com) and sign up
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Click "Create Web Service"
7. Copy the deployed URL (e.g., `https://your-service.onrender.com`)
8. Update the frontend `BACKEND_URL` constant with this URL

## API Endpoints

- `GET /api/radar/latest` - Fetches the latest MRMS RALA data
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3001)
