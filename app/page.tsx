'use client';

import Image from 'next/image';
import Link from 'next/link';
import ProjectionLists from '../definitions/ProjectionType';
import { useState } from 'react';

//Chevron down and up
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

export default function Home() {
  const [openProjections, setOpenProjections] = useState<boolean[]>(
    ProjectionLists.map(() => false)
  );

  const toggleIndex = (index: number) => {
    const new_projections = openProjections.map((_, i) =>
      i === index ? !openProjections[i] : openProjections[i]
    );
    setOpenProjections(new_projections);
  };

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

        {ProjectionLists.map((projection, index) => (
          <div
            key={projection.name}
            className="w-full flex flex-col items-center space-y-4"
          >
            <h2 className="text-2xl font-semibold">{projection.name}</h2>
            <Link
              href={projection.link}
              className="text-blue-500 hover:underline"
            >
              {projection.epsg_code}
            </Link>
            <button
              onClick={() => toggleIndex(index)}
              className="flex items-center space-x-2"
            >
              <span>
                {openProjections[index] ? <BiChevronUp /> : <BiChevronDown />}
              </span>
              <span>View Description</span>
            </button>

            {openProjections[index] && (
              <div className="w-full flex flex-row flex-wrap  items-center space-y-4">
                <div className="w-full md:w-1/2 flex flex-col  items-center space-y-4 space-x-4 ">
                  {/* Title For Description */}
                  <h2 className="text-2xl font-semibold m-4">Description</h2>
                  <p>{projection.description}</p>
                </div>

                <div className="w-full flex md:w-1/2  flex-col items-center space-y-4 space-x-4">
                  {/* Title For Map */}
                  <h2 className="text-2xl font-semibold">Map View</h2>
                  <Image
                    src={`${projection.image_url}`}
                    alt={projection.name}
                    width={500}
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
