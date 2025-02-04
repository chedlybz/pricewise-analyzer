import { corsHeaders } from '../_shared/cors.ts';
import FirecrawlApp from 'npm:@mendable/firecrawl-js';

function generateMeilleursAgentsUrl(ville: string, codePostal: string) {
  // Vérifier si la ville est Paris
  if (ville.toLowerCase() === "paris" && codePostal.startsWith("75")) {
    // Extraire l'arrondissement de Paris à partir du code postal
    const arrondissement = parseInt(codePostal.substring(3), 10); // Ex: "75015" -> 15
    if (arrondissement >= 1 && arrondissement <= 20) {
      return `https://www.meilleursagents.com/prix-immobilier/paris-${arrondissement}eme-arrondissement-${codePostal}/`;
    }
  }
  // Cas général pour toutes les autres villes
  return `https://www.meilleursagents.com/prix-immobilier/${ville.toLowerCase()}-${codePostal}/`;
}

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

    const { location, city, propertyType, area } = await req.json();
    console.log('Received request params:', { location, city, propertyType, area });
    
    if (!location || !propertyType || !area) {
      throw new Error('Missing required parameters');
    }

    // Initialize Firecrawl
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey });

    // Generate MeilleursAgents URL with city and postal code
    const meilleursAgentsUrl = generateMeilleursAgentsUrl(city || location, location);
    
    console.log('Crawling MeilleursAgents URL:', meilleursAgentsUrl);
    
    const priceResponse = await firecrawl.scrapeUrl(meilleursAgentsUrl, {
      scrapeRules: {
        selectors: {
          averagePrice: {
            selector: '.prices-summary__price--desktop',
            type: 'text'
          },
          priceRange: {
            selector: '.prices-summary__range',
            type: 'text'
          }
        }
      },
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('MeilleursAgents response:', priceResponse);

    if (!priceResponse.success) {
      throw new Error('Failed to fetch price data from MeilleursAgents');
    }

    // Extract average price per m2
    const averagePricePerM2 = priceResponse.data.averagePrice ?
      parseInt(priceResponse.data.averagePrice.replace(/[^0-9]/g, ''), 10) : 0;

    // Construct SeLoger URL for listings
    const propertyTypeParam = propertyType === 'apartment' ? '1' : '2';
    const areaMin = Math.max(area - 20, 0);
    const areaMax = area + 20;
    
    const selogerUrl = `https://www.seloger.com/list.htm?projects=2&types=${propertyTypeParam}&places=[{cp:${location}}]&surface=${areaMin}/${areaMax}&enterprise=0&qsVersion=1.0`;
    
    console.log('Crawling SeLoger URL:', selogerUrl);

    // Scrape SeLoger listings
    const listingsResponse = await firecrawl.scrapeUrl(selogerUrl, {
      scrapeRules: {
        selectors: {
          title: { selector: '[data-testid="sl.list-item.title"]', type: 'text' },
          price: { selector: '[data-testid="sl.price"]', type: 'text' },
          area: { selector: '[data-testid="sl.list-item.surface"]', type: 'text' },
          url: { selector: 'a', type: 'attribute', attribute: 'href' }
        }
      },
      waitUntil: 'networkidle0',
      timeout: 30000
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