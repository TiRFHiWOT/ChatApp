# Social Media Preview Setup

## What Was Added

I've added Open Graph and Twitter Card meta tags to enable social media previews when sharing your URL.

## Files Created/Modified

1. **`app/opengraph-image.tsx`** - Dynamically generates the Open Graph image (1200x630px)
2. **`app/layout.tsx`** - Updated with comprehensive meta tags including:
   - Open Graph tags (for Facebook, LinkedIn, etc.)
   - Twitter Card tags
   - SEO meta tags

## How It Works

When someone shares `https://chat-app-rho-wheat.vercel.app/` on social media:

1. **Facebook/LinkedIn**: Uses Open Graph tags to show:

   - Title: "Chat App - Real-time Messaging"
   - Description: "Connect and chat in real-time with friends and colleagues..."
   - Image: Generated dynamically at `/opengraph-image`

2. **Twitter**: Uses Twitter Card tags with the same information

3. **Other Platforms**: Will use Open Graph tags as fallback

## Testing Your Preview

After deploying, test your previews using these tools:

1. **Facebook Sharing Debugger**:

   - https://developers.facebook.com/tools/debug/
   - Enter your URL and click "Scrape Again" to refresh cache

2. **Twitter Card Validator**:

   - https://cards-dev.twitter.com/validator
   - Enter your URL to see how it will appear

3. **LinkedIn Post Inspector**:
   - https://www.linkedin.com/post-inspector/
   - Enter your URL to preview

## Important Notes

- **Cache**: Social media platforms cache previews. After updating, use the "Scrape Again" feature in the debuggers to refresh
- **Image Size**: The OG image is 1200x630px (recommended size)
- **Dynamic Generation**: The image is generated on-demand, so it's always up-to-date
- **Deployment**: After deploying, wait a few minutes for the changes to propagate

## Customizing the Preview Image

To customize the Open Graph image, edit `app/opengraph-image.tsx`. You can:

- Change colors, text, layout
- Add your logo
- Modify the design

The image is generated using React components, so you have full control over the design.

## Troubleshooting

If previews don't show up:

1. **Check the URL**: Make sure you're testing the production URL
2. **Clear Cache**: Use the debugger tools to clear platform caches
3. **Verify Meta Tags**: View page source and check for `<meta property="og:image">` tags
4. **Check Image URL**: Visit `https://chat-app-rho-wheat.vercel.app/opengraph-image` directly to see if it loads
5. **Wait**: Sometimes it takes a few minutes for changes to propagate

## Next Steps

1. Deploy your changes to Vercel
2. Wait for deployment to complete
3. Test using the debugger tools above
4. Share on social media to verify it works!
