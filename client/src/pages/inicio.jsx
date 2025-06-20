import React, { useState } from 'react';
import banner from '../assets/banner.jpg';
import Fondo_AI from '../assets/Fondo_AI.jpg';
import axios from 'axios';

export function Inicio() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Seleccionar');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [ticker, setTicker] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [plotUrl, setPlotUrl] = useState('');

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);

    if (option === 's&p500') {
      setBatchSize(10);
    } else if (option === 'downjones') {
      setBatchSize(2);
    }
  };

  const HacerPeticion = async () => {
    console.log(`Selected Option ${selectedOption}`);
    console.log(`StartDate ${startDate}`);
    console.log(`EndDate ${endDate}`);
    console.log(`Batch Size ${batchSize}`);
    console.log(`Ticker ${ticker}`);

    const TrainData = {
      index: selectedOption,
      start_date: startDate,
      end_date: endDate,
      batch_size: batchSize,
    };

    const InferenceDate = {
      ticker: ticker,
      start_date: startDate,
      end_date: endDate,
      index: selectedOption,
    };

    try {
      const R1 = await axios.post('http://localhost:8000/train', TrainData);
      console.log('Respuesta entrenamiento', R1.data);
  
      const R2 = await axios.post('http://localhost:8001/inference', InferenceDate);
      console.log('Respuesta Inferencia', R2.data);
      console.log('Respuesta Inferencia', R2.data.path);
      setPlotUrl(R2.data.path);

    } catch (error) {
      console.error('Error en las peticiones:', error);
    }
  };

  const obtenerGrafica = async (e) => {
    e.preventDefault(); // 👈 Evita que el formulario se recargue
    try {
      const response = await axios.post('http://localhost:8002/plot',
        { url: plotUrl },
        { responseType: 'blob' }
      );

      const imageObjectURL = URL.createObjectURL(response.data);
      setImageSrc(imageObjectURL);
    } catch (error) {
      console.error('Error al generar la gráfica:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center" style={{ backgroundImage: `url(${Fondo_AI})` }}>
      <header className="py-8 px-8 flex justify-between items-center shadow-md"
        style={{ backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <h1 className="text-6xl text-white font-bold">Predicciones IA</h1>
        <span className="text-5xl">🌐</span>
      </header>

      <div className="flex justify-center items-center p-8 min-h-[calc(100vh-160px)]">
        <form className="bg-white bg-opacity-80 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">

          {/* Menú desplegable */}
          <div className="flex justify-between items-center relative">
            <label className="font-semibold">Data</label>
            <div className="ml-4 flex-1 relative">
              <button type="button" onClick={toggleMenu} className="w-full p-2 rounded text-black bg-gray-200 text-left">
                {selectedOption}
              </button>

              {isOpen && (
                <div className="absolute mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button type="button" onClick={() => handleSelect('s&p500')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                      s&p500
                    </button>
                    <button type="button" onClick={() => handleSelect('downjones')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Down Jones
                    </button>
                    <button type="button" onClick={() => handleSelect('nasdaq100')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Nasdaq-100
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="font-semibold">Ticker</label>
            <input
              type="text"
              className="ml-4 flex-1 p-2 rounded text-black bg-gray-200"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </div>


          {/* Fechas */}
          <div className="flex justify-between items-center">
            <label className="font-semibold">Start Date</label>
            <input type="date" className="ml-4 flex-1 p-2 rounded text-black bg-gray-200"
              value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="flex justify-between items-center">
            <label className="font-semibold">End Date</label>
            <input type="date" className="ml-4 flex-1 p-2 rounded text-black bg-gray-200"
              value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {/* Barra de progreso (aún estática) */}
          <div className="mt-6">
            <label className="font-semibold">Progress</label>
            <div className="w-full bg-gray-300 h-2 rounded mt-2">
              <div className="bg-red-600 h-2 rounded" style={{ width: '40%' }}></div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col space-y-4 mt-8">
            <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition">
              Show Me Data Frame
            </button>

            <button type="button" className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition" onClick={HacerPeticion}>
              Show Me A Graphic
            </button>

            {plotUrl && (
              <button type="button" onClick={obtenerGrafica} className="bg-green-600 text-white py-2 px-4 rounded-full hover:bg-green-700 transition">
                Generar Gráfica
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Imagen generada */}
      {imageSrc && (
        <div className="flex justify-center mt-8">
          <img src={imageSrc} alt="Gráfica generada" className="max-w-4xl rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
}
