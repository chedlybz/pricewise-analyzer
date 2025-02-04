import { supabase } from "@/integrations/supabase/client";

interface PropertyListing {
  price: number;
  area: number;
  location: string;
  propertyType: string;
  url: string;
  title: string;
}

interface MarketData {
  averagePricePerM2: number;
  location: string;
  propertyType: string;
}

interface ListingsResponse {
  listings: PropertyListing[];
  marketData: MarketData;
}

export class FirecrawlService {
  static generateMeilleursAgentsUrl(ville: string, codePostal: string) {
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

  static async fetchListings(searchParams: {
    location: string;
    city: string;
    propertyType: string;
    area: number;
  }): Promise<ListingsResponse> {
    try {
      console.log('Fetching listings with params:', searchParams);
      
      const { data, error } = await supabase.functions.invoke('fetch-listings', {
        body: searchParams
      });

      if (error) {
        console.error('Error from Supabase function:', error);
        throw error;
      }

      console.log('Received listings response:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchListings:', error);
      throw error;
    }
  }
}