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
    const propertyTypeParam = propertyType === 'apartment' ? '1' : '2'; // 1 for apartments, 2 for houses
    const areaMin = Math.max(area - 20, 0);
    const areaMax = area + 20;
    
    const selogerUrl = `https://www.seloger.com/list.htm?projects=2&types=${propertyTypeParam}&places=[{cp:${location}}]&surface=${areaMin}/${areaMax}&enterprise=0&qsVersion=1.0`;
    
    console.log('Crawling SeLoger URL:', selogerUrl);

    // Crawl SeLoger with updated API structure
    const response = await firecrawl.crawlUrl(selogerUrl, {
      limit: 5,
      scrapeRules: {
        listings: {
          selector: '[data-testid="sl.list-item"]',
          type: 'list',
          fields: {
            title: {
              selector: '[data-testid="sl.list-item.title"]',
              type: 'text'
            },
            price: {
              selector: '[data-testid="sl.price"]',
              type: 'text',
              transform: (text: string) => parseInt(text.replace(/[^0-9]/g, ''))
            },
            area: {
              selector: '[data-testid="sl.list-item.surface"]',
              type: 'text',
              transform: (text: string) => parseInt(text.replace(/[^0-9]/g, ''))
            },
            url: {
              selector: 'a',
              type: 'attribute',
              attribute: 'href'
            }
          }
        }
      }
    });

    console.log('SeLoger crawl response:', response);

    if (!response.success) {
      throw new Error('Failed to crawl SeLoger');
    }

    // Transform and filter the listings
    const listings = (response.data?.listings || [])
      .filter(listing => listing.price && listing.area)
      .map(listing => ({
        title: listing.title || 'Annonce SeLoger',
        price: listing.price,
        area: listing.area,
        location,
        propertyType,
        url: listing.url.startsWith('http') ? listing.url : `https://www.seloger.com${listing.url}`
      }));

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