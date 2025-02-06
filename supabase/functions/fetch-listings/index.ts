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

    const { location } = await req.json();
    console.log('Received request params:', { location });
    
    if (!location) {
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
    
    console.log('Fetching data from:', meilleursAgentsUrl);
    
    const priceResponse = await firecrawl.scrapeUrl(meilleursAgentsUrl);

    console.log('MeilleursAgents response:', priceResponse);

    if (!priceResponse.success) {
      throw new Error('Failed to fetch price data from MeilleursAgents');
    }

    // Extract price data from the HTML content
    const html = priceResponse.data.html;
    const priceMatch = html.match(/(\d+[\s,]?\d*)\s*€\/m²/);
    const averagePricePerM2 = priceMatch ? 
      parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 
      null;

    // Mock some listings data for demonstration
    const mockListings = [
      {
        price: averagePricePerM2 ? averagePricePerM2 * 50 : 500000,
        area: 50,
        location: location,
        propertyType: "apartment",
        url: meilleursAgentsUrl,
        title: "Appartement type"
      }
    ];

    return new Response(JSON.stringify({
      listings: mockListings,
      marketData: {
        averagePricePerM2: averagePricePerM2 || 10000,
        location: location,
        propertyType: "apartment"
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});