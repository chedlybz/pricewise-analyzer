import { useState } from "react";
import PriceAnalysisForm from "@/components/PriceAnalysisForm";
import AnalysisResult from "@/components/AnalysisResult";

interface FormData {
  price: number;
  area: number;
  location: string;
  propertyType: string;
}

const Index = () => {
  const [analysis, setAnalysis] = useState<{
    userPrice: number;
    marketPrice: number;
    difference: number;
    location: string;
    propertyType: string;
    area: number;
    averagePricePerM2: number;
  } | null>(null);

  const handleAnalysis = async (data: FormData) => {
    try {
      const response = await FirecrawlService.fetchListings(data);
      const estimatedMarketPrice = Math.round(data.area * response.marketData.averagePricePerM2);
      
      setAnalysis({
        userPrice: data.price,
        marketPrice: estimatedMarketPrice,
        difference: data.price - estimatedMarketPrice,
        location: data.location,
        propertyType: data.propertyType,
        area: data.area,
        averagePricePerM2: response.marketData.averagePricePerM2
      });
    } catch (error) {
      console.error('Error analyzing price:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le prix pour le moment",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Analyseur de Prix Immobilier
          </h1>
          <p className="text-gray-600">
            Comparez le prix de votre bien avec le marché actuel
          </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <PriceAnalysisForm onSubmit={handleAnalysis} />
          {analysis && (
            <AnalysisResult
              userPrice={analysis.userPrice}
              marketPrice={analysis.marketPrice}
              difference={analysis.difference}
              location={analysis.location}
              propertyType={analysis.propertyType}
              area={analysis.area}
              averagePricePerM2={analysis.averagePricePerM2}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;