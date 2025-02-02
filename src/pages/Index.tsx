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
  } | null>(null);

  const handleAnalysis = (data: FormData) => {
    // Simulation d'un calcul de prix du marché
    // Dans une version réelle, ceci serait basé sur des données réelles
    const averagePricePerM2 = data.propertyType === "apartment" ? 3500 : 3000;
    const locationFactor = data.location.toLowerCase().includes("paris") ? 1.5 : 1;
    const estimatedMarketPrice = Math.round(data.area * averagePricePerM2 * locationFactor);
    
    setAnalysis({
      userPrice: data.price,
      marketPrice: estimatedMarketPrice,
      difference: data.price - estimatedMarketPrice,
    });
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;