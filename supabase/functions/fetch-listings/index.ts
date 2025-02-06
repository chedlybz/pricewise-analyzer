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

    const { location, city, propertyType } = await req.json();
    console.log('Received request params:', { location, city, propertyType });
    
    if (!location) {
      throw new Error('Missing required parameters');
    }

    // Initialize Firecrawl
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey });

    // Construct MeilleursAgents URL
    let meilleursAgentsUrl;
    if (city.toLowerCase() === 'paris' && location.startsWith('75')) {
      const arrondissement = parseInt(location.substring(3), 10);
      meilleursAgentsUrl = `https://www.meilleursagents.com/prix-immobilier/paris-${arrondissement}eme-arrondissement-${location}/`;
    } else {
      meilleursAgentsUrl = `https://www.meilleursagents.com/prix-immobilier/${city.toLowerCase()}-${location}/`;
    }
    
    console.log('Fetching data from:', meilleursAgentsUrl);
    
    const priceResponse = await firecrawl.scrapeUrl(meilleursAgentsUrl);
    console.log('Raw Firecrawl response:', JSON.stringify(priceResponse, null, 2));

    if (!priceResponse.success) {
      throw new Error(`Failed to fetch price data: ${JSON.stringify(priceResponse)}`);
    }

    // Get content from response
    const content = priceResponse.markdown || '';
    console.log('Content length:', content.length);
    
    if (!content) {
      console.error('No content found in response');
      throw new Error('No content found in Firecrawl response');
    }

    // Extract price data from the content using a more specific pattern
    let averagePricePerM2;
    
    if (propertyType === 'apartment') {
      const apartmentMatch = content.match(/Appartement\s*\n\s*-\s*Prix m2 moyen\s*-\s*(\d+[\s,]?\d*)\s*€/);
      console.log('Apartment price match:', apartmentMatch);
      averagePricePerM2 = apartmentMatch ? parseInt(apartmentMatch[1].replace(/\s/g, ''), 10) : null;
    } else {
      const houseMatch = content.match(/Maison\s*\n\s*-\s*Prix m2 moyen\s*-\s*(\d+[\s,]?\d*)\s*€/);
      console.log('House price match:', houseMatch);
      averagePricePerM2 = houseMatch ? parseInt(houseMatch[1].replace(/\s/g, ''), 10) : null;
    }

    if (!averagePricePerM2) {
      console.error('Could not find price in content');
      throw new Error('Could not extract price from the content');
    }

    console.log('Extracted average price per m2:', averagePricePerM2);

    // Mock some listings data with the real average price
    const mockListings = [
      {
        price: averagePricePerM2 * 50,
        area: 50,
        location: location,
        propertyType: propertyType,
        url: meilleursAgentsUrl,
        title: `${propertyType === 'apartment' ? 'Appartement' : 'Maison'} type`
      }
    ];

    const response = {
      listings: mockListings,
      marketData: {
        averagePricePerM2: averagePricePerM2,
        location: location,
        propertyType: propertyType
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