import FirecrawlApp from '@mendable/firecrawl-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, propertyType, area } = await req.json();
    
    const firecrawl = new FirecrawlApp({ 
      apiKey: Deno.env.get('FIRECRAWL_API_KEY') || '' 
    });

    // Construire les URLs des principaux sites immobiliers
    const urls = [
      `https://www.seloger.com/immobilier/achat/${propertyType}/${location}`,
      `https://www.leboncoin.fr/recherche?category=9&locations=${location}&real_estate_type=${propertyType === 'apartment' ? 'appartement' : 'maison'}`
    ];

    const results = [];
    
    for (const url of urls) {
      console.log(`Crawling: ${url}`);
      
      const response = await firecrawl.crawlUrl(url, {
        limit: 10,
        scrapeOptions: {
          selectors: {
            price: '.price, .price-label',
            area: '.area, .surface-label',
            title: '.listing-title, .title',
            url: 'a.listing-link'
          }
        }
      });

      if (response.success) {
        results.push(...response.data);
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

    return new Response(JSON.stringify(listings), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-listings:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});