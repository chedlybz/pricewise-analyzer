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

    // Construct MeilleursAgents URL with postal code
    const meilleursAgentsUrl = `https://www.meilleursagents.com/prix-immobilier/${location}/`;
    
    console.log('Crawling MeilleursAgents URL:', meilleursAgentsUrl);

    // Scrape MeilleursAgents for price data
    const priceResponse = await firecrawl.scrapeUrl(meilleursAgentsUrl, {
      selectors: {
        priceRange: { 
          selector: '.prices-summary__price--desktop', 
          type: 'text',
          multiple: true 
        }
      }
    });

    console.log('MeilleursAgents response:', priceResponse);

    if (!priceResponse.success) {
      throw new Error('Failed to fetch price data from MeilleursAgents');
    }

    // Extract average price per m2 for apartments
    let averagePricePerM2 = 0;
    if (priceResponse.data.priceRange && priceResponse.data.priceRange.length > 0) {
      const prices = priceResponse.data.priceRange.map(price => 
        parseInt(price.replace(/[^0-9]/g, ''))
      );
      averagePricePerM2 = prices[0]; // First price is usually the apartment average
    }

    // Construct SeLoger URL for listings
    const propertyTypeParam = propertyType === 'apartment' ? '1' : '2';
    const areaMin = Math.max(area - 20, 0);
    const areaMax = area + 20;
    
    const selogerUrl = `https://www.seloger.com/list.htm?projects=2&types=${propertyTypeParam}&places=[{cp:${location}}]&surface=${areaMin}/${areaMax}&enterprise=0&qsVersion=1.0`;
    
    console.log('Crawling SeLoger URL:', selogerUrl);

    // Scrape SeLoger listings
    const listingsResponse = await firecrawl.scrapeUrl(selogerUrl, {
      selectors: {
        title: { selector: '[data-testid="sl.list-item.title"]', type: 'text' },
        price: { selector: '[data-testid="sl.price"]', type: 'text' },
        area: { selector: '[data-testid="sl.list-item.surface"]', type: 'text' },
        url: { selector: 'a', type: 'attribute', attribute: 'href' }
      }
    });

    console.log('SeLoger listings response:', listingsResponse);

    if (!listingsResponse.success) {
      throw new Error('Failed to fetch listings from SeLoger');
    }

    // Transform the scraped data into structured listings
    const listings = listingsResponse.data.map(item => ({
      title: item.title || 'Annonce SeLoger',
      price: parseInt(item.price?.replace(/[^0-9]/g, '') || '0'),
      area: parseInt(item.area?.replace(/[^0-9]/g, '') || '0'),
      location,
      propertyType,
      url: item.url?.startsWith('http') ? item.url : `https://www.seloger.com${item.url || ''}`
    })).filter(listing => listing.price > 0 && listing.area > 0);

    // Add average price per m2 to the response
    const response = {
      listings,
      marketData: {
        averagePricePerM2,
        location,
        propertyType
      }
    };

    console.log('Final response:', response);

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch data',
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