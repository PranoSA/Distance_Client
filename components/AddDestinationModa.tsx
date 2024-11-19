'use client';

import { Destination } from '@/definitions/Destinations';
import { useEffect, useState } from 'react';
import { Destinations } from '@/definitions/Destinations';
import CryptoJS from 'crypto-js';

type DestinationModalProps = {
  show: boolean;
  handleClose: () => void;
  handleAdd: (dest: Destination) => void;
  handleOpen: () => void;
};

export const AddDestinationModal: React.FC<DestinationModalProps> = ({
  show,
  handleClose,
  handleAdd,
  handleOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resultDestinations, setResultDestinations] = useState<Destination[]>(
    []
  );

  useEffect(() => {
    const searchFunc = () => {
      if (searchTerm === '') {
        setResultDestinations([]);
        return;
      }

      const search = searchTerm.toLowerCase();
      const destinations = Destinations.filter(
        (destination) =>
          destination.name.toLowerCase().includes(search) ||
          destination.code_names?.some((code) =>
            code.toLowerCase().includes(search)
          )
      );

      setResultDestinations(destinations);
    };

    //add debouncing
    const timeout = setTimeout(() => {
      searchFunc();
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  if (!show) {
    return (
      <div className="flex justify-center mt-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={handleOpen}
        >
          Open Search
        </button>
      </div>
    );
  }
  console.log('Re-REnder');
  console.log(resultDestinations);

  const destinationList = resultDestinations.map((destination) => (
    <div
      key={
        Destinations.findIndex(
          (dest) =>
            dest.name === destination.name &&
            dest.lat === destination.lat &&
            dest.long === destination.long
        ) + Math.random()

        /*CryptoJS.MD5(
        destination.name + destination.lat + destination.long
      ).toString()*/
      }
      className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      onClick={() => {
        setSearchTerm('');
        handleAdd(destination);
      }}
    >
      {destination.name}
    </div>
  ));

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center`}>
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={handleClose}
      ></div>
      <div className="bg-white dark:bg-blue-800  rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6 z-50 ">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Destination</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => {
              setSearchTerm('');
              handleClose();
            }}
          >
            &times;
          </button>
        </div>
        <input
          type="text"
          placeholder="Search for a destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-800 dark:text-white"
        />
        <div className="max-h-48 overflow-y-auto"> {destinationList} </div>
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
