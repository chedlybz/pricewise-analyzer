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

    // Extract price data
    const averagePricePerM2 = priceResponse.data.averagePrice ?
      parseInt(priceResponse.data.averagePrice.replace(/[^0-9]/g, ''), 10) : null;

    const priceRange = priceResponse.data.priceRange || 'N/A';

    return new Response(JSON.stringify({
      averagePricePerM2,
      priceRange
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