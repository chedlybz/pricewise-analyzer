import { corsHeaders } from '../_shared/cors.ts';

// Prix moyens au m² par ville (données à titre d'exemple)
const AVERAGE_PRICES = {
  'paris': {
    apartment: 10500,
    house: 11800
  },
  'lyon': {
    apartment: 5200,
    house: 5800
  },
  'marseille': {
    apartment: 3500,
    house: 4200
  },
  'bordeaux': {
    apartment: 4800,
    house: 5500
  },
  'toulouse': {
    apartment: 3800,
    house: 4500
  },
  // Prix par défaut si la ville n'est pas trouvée
  'default': {
    apartment: 3500,
    house: 4000
  }
};

// Données d'exemple pour les annonces similaires
const SAMPLE_LISTINGS = {
  'paris': [
    {
      title: "Appartement lumineux proche métro",
      price: 850000,
      area: 75,
      location: "Paris",
      url: "https://www.example.com/listing1",
    },
    {
      title: "Studio rénové dans le Marais",
      price: 450000,
      area: 30,
      location: "Paris",
      url: "https://www.example.com/listing2",
    }
  ],
  'lyon': [
    {
      title: "T3 avec vue sur Rhône",
      price: 380000,
      area: 65,
      location: "Lyon",
      url: "https://www.example.com/listing3",
    }
  ],
  // ... autres villes
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { location, propertyType, area } = await req.json();
    
    if (!location || !propertyType || !area) {
      throw new Error('Missing required parameters: location, propertyType, and area are required');
    }

    console.log('Processing request with params:', { location, propertyType, area });

    // Normaliser le nom de la ville
    const normalizedCity = location.toLowerCase().trim();
    
    // Obtenir les prix moyens pour la ville
    const cityPrices = AVERAGE_PRICES[normalizedCity] || AVERAGE_PRICES.default;
    const avgPricePerM2 = cityPrices[propertyType];

    // Calculer le prix estimé du marché
    const estimatedPrice = Math.round(area * avgPricePerM2);

    // Obtenir des annonces similaires (données d'exemple)
    const similarListings = SAMPLE_LISTINGS[normalizedCity] || [];

    // Filtrer les annonces par superficie similaire
    const filteredListings = similarListings
      .filter(listing => Math.abs(listing.area - area) <= 20)
      .slice(0, 3); // Limiter à 3 résultats

    console.log(`Processed request for ${location} with estimated price: ${estimatedPrice}`);

    return new Response(
      JSON.stringify(filteredListings),
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