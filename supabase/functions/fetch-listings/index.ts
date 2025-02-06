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
    console.log('Raw Firecrawl response:', priceResponse);

    if (!priceResponse.success) {
      throw new Error(`Failed to fetch price data: ${JSON.stringify(priceResponse)}`);
    }

    // Vérifier si data et html existent
    if (!priceResponse.data || !priceResponse.data.html) {
      console.error('Invalid response structure:', priceResponse);
      throw new Error('Invalid response structure from Firecrawl');
    }

    // Extract price data from the HTML content
    const html = priceResponse.data.html;
    console.log('HTML content length:', html.length);
    
    const priceMatch = html.match(/(\d+[\s,]?\d*)\s*€\/m²/);
    console.log('Price match result:', priceMatch);
    
    const averagePricePerM2 = priceMatch ? 
      parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 
      10000; // Prix par défaut si non trouvé

    console.log('Calculated average price per m2:', averagePricePerM2);

    // Mock some listings data for demonstration
    const mockListings = [
      {
        price: averagePricePerM2 * 50,
        area: 50,
        location: location,
        propertyType: "apartment",
        url: meilleursAgentsUrl,
        title: "Appartement type"
      }
    ];

    const response = {
      listings: mockListings,
      marketData: {
        averagePricePerM2: averagePricePerM2,
        location: location,
        propertyType: "apartment"
      }
    };

    console.log('Sending response:', response);

    return new Response(JSON.stringify(response), {
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