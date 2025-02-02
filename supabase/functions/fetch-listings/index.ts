import 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { FirecrawlApp } from 'npm:@mendable/firecrawl-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, propertyType, area } = await req.json();
    console.log('Received request with params:', { location, propertyType, area });
    
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not found in environment variables');
      throw new Error('API key not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey });

    // Construire les URLs des principaux sites immobiliers français
    const urls = [
      `https://www.seloger.com/immobilier/achat/${propertyType}/${location}`,
      `https://www.leboncoin.fr/recherche?category=9&locations=${location}&real_estate_type=${propertyType === 'apartment' ? 'appartement' : 'maison'}`
    ];

    const results = [];
    
    for (const url of urls) {
      console.log(`Crawling URL: ${url}`);
      
      try {
        const response = await firecrawl.crawlUrl(url, {
          limit: 5,
          scrapeOptions: {
            selectors: {
              price: '.price, .price-label',
              area: '.area, .surface-label',
              title: '.listing-title, .title',
              url: 'a.listing-link'
            }
          }
        });

        console.log(`Crawl response for ${url}:`, response);

        if (response.success) {
          results.push(...response.data);
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        // Continue with other URLs even if one fails
      }
    }

    // Filtrer et formater les résultats
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
      .filter(item => 
        Math.abs(item.area - area) <= 20 // À 20m² près
      );

    console.log('Filtered listings:', listings);

    return new Response(JSON.stringify(listings), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-listings:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});