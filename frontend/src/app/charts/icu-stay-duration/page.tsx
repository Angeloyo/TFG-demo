import ICUStayChart from "@/components/charts/ICUStayChart";
import BackLink from '@/components/ui/BackLink';

export default function ICUStayDurationPage() {
  return (
    <div className="min-h-[calc(100vh-8.6rem)] bg-white py-8 md:py-12 lg:py-16 xl:py-20 justify-center flex">
      <div className="max-w-6xl mx-auto px-4">
        
        <BackLink />
        
        <h1 className="text-xl font-light text-black mb-8 text-center">
          Estancia Promedio por Unidad UCI
        </h1>
        <ICUStayChart />
      </div>
    </div>
  );
} 