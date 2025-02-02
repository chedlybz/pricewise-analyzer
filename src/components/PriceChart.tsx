import { Bar } from "recharts";
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PriceChartProps {
  userPrice: number;
  marketPrice: number;
}

const PriceChart = ({ userPrice, marketPrice }: PriceChartProps) => {
  const data = [
    {
      name: "Prix proposé",
      value: userPrice,
    },
    {
      name: "Prix du marché",
      value: marketPrice,
    },
  ];

  return (
    <div className="w-full h-[200px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => value.toLocaleString('fr-FR') + ' €'}
          />
          <Bar
            dataKey="value"
            fill="#1a365d"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;