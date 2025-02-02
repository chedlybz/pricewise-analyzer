import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  price: number;
  area: number;
  location: string;
  propertyType: string;
}

interface PriceAnalysisFormProps {
  onSubmit: (data: FormData) => void;
}

const PriceAnalysisForm = ({ onSubmit }: PriceAnalysisFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    price: 0,
    area: 0,
    location: "",
    propertyType: "apartment",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md p-6 animate-fadeIn">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="price">Prix (€)</Label>
          <Input
            id="price"
            type="number"
            required
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">Superficie (m²)</Label>
          <Input
            id="area"
            type="number"
            required
            min="0"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ville</Label>
          <Input
            id="location"
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Type de bien</Label>
          <Select
            value={formData.propertyType}
            onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Appartement</SelectItem>
              <SelectItem value="house">Maison</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Analyser le prix
        </Button>
      </form>
    </Card>
  );
};

export default PriceAnalysisForm;