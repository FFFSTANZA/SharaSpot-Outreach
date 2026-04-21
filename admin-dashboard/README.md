# SharaSpot Admin Dashboard

A local-only admin dashboard for tracking platform metrics via API.

## Setup

1. **Configure server:**
   - Add `ADMIN_SECRET_KEY` to your server's `.env` file
   - Generate a secret: `openssl rand -hex 32`

2. **Configure admin dashboard:**
   ```bash
   cd admin-dashboard
   npm install
   ```

3. **Update .env:**
   - Set `NEXT_PUBLIC_API_URL` to your server URL
   - Set `NEXT_PUBLIC_ADMIN_SECRET` to match your server's `ADMIN_SECRET_KEY`

4. **Run the dashboard:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3001
   ```

## Security

- The admin API is protected by a secret key header (`x-admin-secret`)
- The dashboard does NOT connect directly to the database
- Only the server owner knows the secret key
- No authentication required for the dashboard itself (it's for local use only)

## Available Metrics

- **Users**: Total, Premium, Free, Trial
- **Senders**: Total, Verified, Unverified
- **Campaigns**: By status (Scheduled, Sending, Paused, Completed, Cancelled)
- **Emails**: By status (Pending, Sending, Sent, Failed)
- **Tracking**: Opens, Clicks, Replies, Bounces
- **Contacts**: Total count
- **Sequences**: Total follow-up steps
- **Last 7 Days**: New users, campaigns created, emails sent
- **Open Rate**: Calculated percentage

## Usage

This dashboard is for local use only. Run it locally to monitor platform performance. It auto-refreshes every 30 seconds.