import { Card } from "@/components/ui/card";
import PriceChart from "./PriceChart";

interface AnalysisResultProps {
  userPrice: number;
  marketPrice: number;
  difference: number;
}

const AnalysisResult = ({ userPrice, marketPrice, difference }: AnalysisResultProps) => {
  const percentageDiff = ((difference) / marketPrice * 100).toFixed(1);
  const isOverpriced = difference > 0;

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
      </div>
    </Card>
  );
};

export default AnalysisResult;