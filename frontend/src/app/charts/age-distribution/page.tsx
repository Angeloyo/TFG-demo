import AgeDistributionChart from "@/components/charts/AgeDistributionChart";
import BackLink from '@/components/ui/BackLink';

export default function AgeDistributionPage() {
  return (
    <div className="min-h-[calc(100vh-8.6rem)] py-8 md:py-12 lg:py-16 xl:py-20 justify-center flex">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <BackLink />
        
        <div className="mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">
            Distribución por Edad y Género
          </h1>
          <p className="text-gray-600 text-sm">
            Population pyramid
          </p>
        </div>

        {/* Charts */}
        <div className="space-y-16">
          
          {/* Chart 1: Por Rangos */}
          <div className="space-y-4">
            <h3 className="text-lg font-light text-center text-gray-800">
              Por Rangos de Edad
            </h3>
            <AgeDistributionChart detailed={false} />
          </div>

          {/* Chart 2: Detallado */}
          <div className="space-y-4">
            <h3 className="text-lg font-light text-center text-gray-800">
              Por Edad Específica (18-90)
            </h3>
            <AgeDistributionChart detailed={true} />
          </div>

        </div>

      </div>
    </div>
  );
} 