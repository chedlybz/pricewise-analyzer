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
    console.log('Raw Firecrawl response structure:', JSON.stringify(priceResponse, null, 2));

    if (!priceResponse.success) {
      throw new Error(`Failed to fetch price data: ${JSON.stringify(priceResponse)}`);
    }

    // Check response structure
    if (!priceResponse.data) {
      console.error('Missing data in response:', priceResponse);
      throw new Error('Missing data in Firecrawl response');
    }

    // Get content from response
    const content = priceResponse.data.content || priceResponse.data.html || '';
    console.log('Content length:', content.length);
    
    if (!content) {
      console.error('No content found in response');
      throw new Error('No content found in Firecrawl response');
    }

    // Extract price data from the content
    const priceMatch = content.match(/(\d+[\s,]?\d*)\s*€\/m²/);
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