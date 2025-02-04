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
  static async fetchListings(searchParams: {
    location: string;
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