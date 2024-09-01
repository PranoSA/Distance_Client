import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col space-y-8">
        <h1 className="text-3xl font-bold mb-8">
          Web Mercator Distance Calculator
        </h1>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">Calculate Distance</h2>
          <Link href="/3857" className="text-blue-500 hover:underline">
            Distance Calculator
          </Link>
          <Image
            src="/images/3857.png"
            alt="Web Mercator Distance Calculator"
            width={500}
            height={300}
          />
        </div>

        <h1 className="text-3xl font-bold mb-8">Map Projection Views </h1>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Azimuthal Equidistant Projection
          </h2>
          <Link
            href="/54032_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:54032
          </Link>
          <Image
            src="/images/54032_reference.png"
            alt="Azimuthal Equidistant Projection"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Azimuthal Equal Area Projection
          </h2>
          <Link
            href="/3411_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:3411
          </Link>
          <Image
            src="/images/3411_reference.png"
            alt="Azimuthal Equal Area Projection"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Lambert Equal Area Cylindrical Projection
          </h2>
          <Link
            href="/6933_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:6933
          </Link>
          <Image
            src="/images/6933_reference.png"
            alt="Lambert Equal Area Cylindrical Projection"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">Web Mercator Projection</h2>
          <Link
            href="/3857_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:3857
          </Link>
          <Image
            src="/images/3857_reference.png"
            alt="Web Mercator Projection"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">Equirectangular Projection</h2>
          <Link
            href="/4326_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:4326
          </Link>
          <Image
            src="/images/4326_reference.png"
            alt="Equidistant Projection"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Stereotype (Equal Angle) Polar Projection
          </h2>
          <Link
            href="/3031_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:3031
          </Link>
          <Image
            src="/images/3031_reference.png"
            alt="Stereotype Projection"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Lazimuthal Equal Area Projection Europe
          </h2>
          <Link
            href="/3035_reference"
            className="text-blue-500 hover:underline"
          >
            EPSG:3035
          </Link>
          <Image
            src="/images/3035_reference.png"
            alt="Lazimuthal Equal Area Projection Europe"
            width={500}
            height={300}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-semibold">Other Projections</h2>
        </div>
      </div>
    </main>
  );
}
