import HospitalTransfersChord from '@/components/charts/HospitalTransfersChord';
import BackLink from '@/components/ui/BackLink';

export default function Page() {
  return (
    <div className="min-h-[calc(100vh-8.6rem)] py-8 md:py-12 lg:py-16 xl:py-20 justify-center flex">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackLink />

        <div className="mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">
            Flujos hospitalarios
          </h1>
          <p className="text-gray-600 text-sm">
            Directed chord
          </p>
        </div>
        <div className="flex justify-center">
          <HospitalTransfersChord />
        </div>
      </div>
    </div>
  );
}


