import { corsHeaders } from '../_shared/cors.ts';
import FirecrawlApp from 'npm:@mendable/firecrawl-js';

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Validate request
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { location, propertyType, area } = await req.json();
    console.log('Received request params:', { location, propertyType, area });
    
    if (!location || !propertyType || !area) {
      throw new Error('Missing required parameters');
    }

    // Initialize Firecrawl
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey });

    // Construct SeLoger URL based on parameters
    const propertyTypeParam = propertyType === 'apartment' ? '1' : '2';
    const areaMin = Math.max(area - 20, 0);
    const areaMax = area + 20;
    
    const selogerUrl = `https://www.seloger.com/list.htm?projects=2&types=${propertyTypeParam}&places=[{cp:${location}}]&surface=${areaMin}/${areaMax}&enterprise=0&qsVersion=1.0`;
    
    console.log('Crawling SeLoger URL:', selogerUrl);

    // Make request with correct API structure
    const response = await firecrawl.crawlUrl(selogerUrl, {
      formats: ['html'],
      waitFor: 2000, // Wait for dynamic content to load
      timeout: 30000, // 30 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('SeLoger crawl response:', response);

    if (!response.success) {
      throw new Error('Failed to crawl SeLoger');
    }

    // Transform the raw HTML response into structured listings
    const listings = response.data.map(item => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(item.html, 'text/html');
      
      const titleEl = doc.querySelector('[data-testid="sl.list-item.title"]');
      const priceEl = doc.querySelector('[data-testid="sl.price"]');
      const areaEl = doc.querySelector('[data-testid="sl.list-item.surface"]');
      const linkEl = doc.querySelector('a');

      const price = priceEl ? parseInt(priceEl.textContent?.replace(/[^0-9]/g, '') || '0') : 0;
      const extractedArea = areaEl ? parseInt(areaEl.textContent?.replace(/[^0-9]/g, '') || '0') : 0;

      return {
        title: titleEl?.textContent || 'Annonce SeLoger',
        price: price,
        area: extractedArea,
        location,
        propertyType,
        url: linkEl?.href?.startsWith('http') ? linkEl.href : `https://www.seloger.com${linkEl?.href || ''}`
      };
    }).filter(listing => listing.price > 0 && listing.area > 0);

    console.log('Processed listings:', listings);

    return new Response(JSON.stringify(listings), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch listings',
        details: error.message
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});