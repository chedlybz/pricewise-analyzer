import 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { FirecrawlApp } from 'npm:@mendable/firecrawl-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Validate request body
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { location, propertyType, area } = await req.json();
    
    // Validate required parameters
    if (!location || !propertyType || !area) {
      throw new Error('Missing required parameters: location, propertyType, and area are required');
    }

    console.log('Processing request with params:', { location, propertyType, area });

    // Get and validate API key
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not found');
      throw new Error('API configuration error');
    }

    // Initialize Firecrawl with timeout
    const firecrawl = new FirecrawlApp({ 
      apiKey,
      timeout: 30000 // 30 second timeout
    });

    // Define target URLs
    const urls = [
      `https://www.seloger.com/immobilier/achat/${propertyType}/${location}`,
      `https://www.leboncoin.fr/recherche?category=9&locations=${location}&real_estate_type=${propertyType === 'apartment' ? 'appartement' : 'maison'}`
    ];

    const results = [];
    
    // Process each URL with individual error handling
    for (const url of urls) {
      try {
        console.log(`Starting crawl for URL: ${url}`);
        
        const response = await firecrawl.crawlUrl(url, {
          limit: 3, // Reduced limit to prevent timeouts
          scrapeOptions: {
            selectors: {
              price: '.price, .price-label',
              area: '.area, .surface-label',
              title: '.listing-title, .title',
              url: 'a.listing-link'
            }
          }
        });

        if (response.success && response.data) {
          console.log(`Successfully crawled ${url}, found ${response.data.length} results`);
          results.push(...response.data);
        } else {
          console.warn(`No data found for ${url}`);
        }
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
        // Continue with other URLs
      }
    }

    // Process and filter results
    const listings = results
      .filter(item => item.price && item.area)
      .map(item => ({
        price: parseInt(item.price.replace(/[^\d]/g, '')),
        area: parseInt(item.area.replace(/[^\d]/g, '')),
        location,
        propertyType,
        url: item.url,
        title: item.title
      }))
      .filter(item => Math.abs(item.area - area) <= 20);

    console.log(`Processed ${listings.length} relevant listings`);

    return new Response(
      JSON.stringify(listings),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error.message,
        stack: error.stack
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