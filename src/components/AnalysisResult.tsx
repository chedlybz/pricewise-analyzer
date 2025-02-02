import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import PriceChart from "./PriceChart";
import { FirecrawlService } from "@/services/FirecrawlService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface AnalysisResultProps {
  userPrice: number;
  marketPrice: number;
  difference: number;
  location: string;
  propertyType: string;
  area: number;
}

interface PropertyListing {
  price: number;
  area: number;
  location: string;
  propertyType: string;
  url: string;
  title: string;
}

const AnalysisResult = ({ 
  userPrice, 
  marketPrice, 
  difference,
  location,
  propertyType,
  area
}: AnalysisResultProps) => {
  const { toast } = useToast();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const percentageDiff = ((difference) / marketPrice * 100).toFixed(1);
  const isOverpriced = difference > 0;

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await FirecrawlService.fetchListings({
          location,
          propertyType,
          area
        });
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les annonces similaires",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [location, propertyType, area, toast]);

  return (
    <Card className="w-full max-w-md p-6 mt-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold mb-4">Résultat de l'analyse</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Prix proposé</span>
          <span className="font-semibold">{userPrice.toLocaleString('fr-FR')} €</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Prix moyen du marché</span>
          <span className="font-semibold">{marketPrice.toLocaleString('fr-FR')} €</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Écart</span>
          <span className={`font-semibold ${isOverpriced ? 'text-red-500' : 'text-green-500'}`}>
            {isOverpriced ? '+' : ''}{percentageDiff}%
          </span>
        </div>

        <PriceChart userPrice={userPrice} marketPrice={marketPrice} />

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Annonces similaires</h3>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-4">
              {listings.map((listing, index) => (
                <a 
                  key={index}
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <h4 className="font-medium text-lg mb-2">{listing.title}</h4>
                    <div className="flex justify-between text-sm">
                      <span>{listing.area}m² - {listing.location}</span>
                      <span className="font-semibold">{listing.price.toLocaleString('fr-FR')} €</span>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              Aucune annonce similaire trouvée
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AnalysisResult;