import MedicationsSunburst from '@/components/charts/MedicationsSunburst';
import BackLink from '@/components/ui/BackLink';

export default function MedicationsSunburstPage() {
  return (
    <div className="min-h-[calc(100vh-8.6rem)] py-8 md:py-12 lg:py-16 xl:py-20 justify-center flex">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <BackLink />

        <div className="mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">Medicamentos más prescritos por vía</h1>
          <p className="text-gray-600 text-sm">Sunburst</p>
        </div>

        <MedicationsSunburst />
      </div>
    </div>
  );
}


