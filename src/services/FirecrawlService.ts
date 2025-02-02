import { supabase } from "@/integrations/supabase/client";

interface PropertyListing {
  price: number;
  area: number;
  location: string;
  propertyType: string;
  url: string;
  title: string;
}

export class FirecrawlService {
  static async fetchListings(searchParams: {
    location: string;
    propertyType: string;
    area: number;
  }): Promise<PropertyListing[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-listings', {
        body: searchParams
      });

      if (error) {
        console.error('Error fetching listings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchListings:', error);
      throw error;
    }
  }
}