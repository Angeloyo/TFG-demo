import AdmissionHeatmapChart from '@/components/charts/AdmissionHeatmapChart';
import BackLink from '@/components/ui/BackLink';

export default function AdmissionHeatmapPage() {
  return (
    <div className="min-h-[calc(100vh-8.6rem)] py-8 md:py-12 lg:py-16 xl:py-20 justify-center flex">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <BackLink />
        
        <div className="mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">
            Patrones de Ingreso Hospitalario
          </h1>
          <p className="text-gray-600 text-sm">
            Heatmaps
          </p>
        </div>

        {/* Charts */}
        <div className="space-y-16">
          
          {/* Chart 1: Hourly */}
          <div className="space-y-4">
            <h3 className="text-lg font-light text-center text-gray-800">
              Por Hora y Día de la Semana
            </h3>
            <AdmissionHeatmapChart viewType="hourly" />
          </div>

          {/* Chart 2: Monthly */}
          <div className="space-y-4">
            <h3 className="text-lg font-light text-center text-gray-800">
              Por Mes y Día del Mes
            </h3>
            <AdmissionHeatmapChart viewType="monthly" />
          </div>

        </div>
      </div>
    </div>
  );
} 