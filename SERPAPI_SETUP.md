# Setting Up SerpAPI for Real University Data

This guide will help you set up SerpAPI to get real university data in your application.

## Why SerpAPI?

SerpAPI provides access to Google Search results programmatically, allowing us to fetch real, up-to-date university information including:
- Official university names
- Locations and addresses
- Official websites
- Descriptions from knowledge graphs

## Setup Steps

### 1. Create a SerpAPI Account

1. Go to [https://serpapi.com/](https://serpapi.com/)
2. Click **"Sign Up"** (free tier available)
3. Complete the registration process
4. Verify your email address

### 2. Get Your API Key

1. After logging in, go to your [Dashboard](https://serpapi.com/dashboard)
2. You'll see your **API Key** displayed
3. Copy this key (it looks like: `1a2b3c4d5e6f7g8h9i0j...`)

**Free Tier Includes:**
- 100 searches per month
- Access to all search engines
- No credit card required

### 3. Add API Key to Your Project

1. Open your `.env.local` file
2. Add your SerpAPI key:
   ```env
   SERPAPI_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### 4. Add to Vercel (Production)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **classera** project
3. Go to **Settings → Environment Variables**
4. Add a new variable:
   - **Key:** `SERPAPI_API_KEY`
   - **Value:** Your SerpAPI key
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**
6. **Redeploy** your application for changes to take effect

## How It Works

The application uses a **fallback system**:

1. **First:** Tries SerpAPI for real, accurate university data
2. **Fallback:** If SerpAPI fails or quota is exceeded, uses free university APIs

This ensures:
- ✅ Best data quality when SerpAPI is available
- ✅ Application still works if SerpAPI quota is exceeded
- ✅ No service interruption

## Testing

After setup, test the university search:

1. Go to onboarding as a student or mentor
2. Try searching for a university (e.g., "Delhi University", "IIT", "MIT")
3. You should see real universities from Google's data

## API Usage Tips

**Free Tier Limits:** 100 searches/month
**Per Search:** Each university search query = 1 API call

**To conserve quota:**
- The search is debounced (waits 300ms after typing stops)
- Results are cached for 24 hours
- Only triggers when typing 2+ characters
- Returns max 15 results per search

**Estimate:** With 100 searches/month, you can support ~3-4 searches per day

## Upgrading (Optional)

If you need more searches:
- **Developer Plan:** $50/month for 5,000 searches
- **Production Plan:** $150/month for 15,000 searches

Visit [SerpAPI Pricing](https://serpapi.com/pricing) for details.

## Troubleshooting

### "Search service not configured" Error
- **Cause:** `SERPAPI_API_KEY` not set in environment variables
- **Fix:** Add the key to `.env.local` and restart dev server

### No Results Returned
- **Cause 1:** API quota exceeded → Fallback API is being used
- **Cause 2:** Invalid API key
- **Fix:** Check your API key in SerpAPI dashboard

### Check API Usage
1. Go to [SerpAPI Dashboard](https://serpapi.com/dashboard)
2. View your current usage and remaining quota
3. Monitor search history

## Support

- **SerpAPI Docs:** [https://serpapi.com/docs](https://serpapi.com/docs)
- **SerpAPI Support:** support@serpapi.com
- **Project Issues:** Create an issue in the GitHub repository

---

**Note:** The application will work even without SerpAPI (using free fallback APIs), but SerpAPI provides significantly better data quality and accuracy.
