import { useEffect, useState } from 'react';
import { regionsAPI } from '../lib/api';

interface RegionData {
  id: string;
  name: string;
}

interface RegionSelectProps {
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
  onProvinceChange: (id: string, name: string) => void;
  onRegencyChange: (id: string, name: string) => void;
  onDistrictChange: (id: string, name: string) => void;
  onVillageChange: (id: string, name: string) => void;
}

export default function RegionSelect({
  provinceId,
  regencyId,
  districtId,
  villageId,
  onProvinceChange,
  onRegencyChange,
  onDistrictChange,
  onVillageChange,
}: RegionSelectProps) {
  const [provinces, setProvinces] = useState<RegionData[]>([]);
  const [regencies, setRegencies] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<RegionData[]>([]);
  const [villages, setVillages] = useState<RegionData[]>([]);
  
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await regionsAPI.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Error loading provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    if (!provinceId) {
      setRegencies([]);
      return;
    }

    const loadRegencies = async () => {
      setLoadingRegencies(true);
      setRegencies([]);
      onRegencyChange('', '');
      onDistrictChange('', '');
      onVillageChange('', '');
      
      try {
        const data = await regionsAPI.getRegencies(provinceId);
        setRegencies(data);
      } catch (error) {
        console.error('Error loading regencies:', error);
      } finally {
        setLoadingRegencies(false);
      }
    };
    loadRegencies();
  }, [provinceId]);

  // Load districts when regency changes
  useEffect(() => {
    if (!regencyId) {
      setDistricts([]);
      return;
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      setDistricts([]);
      onDistrictChange('', '');
      onVillageChange('', '');
      
      try {
        const data = await regionsAPI.getDistricts(regencyId);
        setDistricts(data);
      } catch (error) {
        console.error('Error loading districts:', error);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, [regencyId]);

  // Load villages when district changes
  useEffect(() => {
    if (!districtId) {
      setVillages([]);
      return;
    }

    const loadVillages = async () => {
      setLoadingVillages(true);
      setVillages([]);
      onVillageChange('', '');
      
      try {
        const data = await regionsAPI.getVillages(districtId);
        setVillages(data);
      } catch (error) {
        console.error('Error loading villages:', error);
      } finally {
        setLoadingVillages(false);
      }
    };
    loadVillages();
  }, [districtId]);

  return (
    <div className="space-y-3">
      {/* Provinsi */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Provinsi <span className="text-red-500">*</span>
        </label>
        <select
          value={provinceId}
          onChange={(e) => {
            const selected = provinces.find(p => p.id === e.target.value);
            onProvinceChange(e.target.value, selected?.name || '');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loadingProvinces}
          required
        >
          <option value="">Pilih Provinsi</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
        {loadingProvinces && <p className="text-xs text-gray-500 mt-1">Memuat...</p>}
      </div>

      {/* Kabupaten/Kota */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Kabupaten/Kota <span className="text-red-500">*</span>
        </label>
        <select
          value={regencyId}
          onChange={(e) => {
            const selected = regencies.find(r => r.id === e.target.value);
            onRegencyChange(e.target.value, selected?.name || '');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!provinceId || loadingRegencies}
          required
        >
          <option value="">Pilih Kabupaten/Kota</option>
          {regencies.map((regency) => (
            <option key={regency.id} value={regency.id}>
              {regency.name}
            </option>
          ))}
        </select>
        {loadingRegencies && <p className="text-xs text-gray-500 mt-1">Memuat...</p>}
      </div>

      {/* Kecamatan */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Kecamatan <span className="text-red-500">*</span>
        </label>
        <select
          value={districtId}
          onChange={(e) => {
            const selected = districts.find(d => d.id === e.target.value);
            onDistrictChange(e.target.value, selected?.name || '');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!regencyId || loadingDistricts}
          required
        >
          <option value="">Pilih Kecamatan</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        {loadingDistricts && <p className="text-xs text-gray-500 mt-1">Memuat...</p>}
      </div>

      {/* Kelurahan/Desa */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Kelurahan/Desa <span className="text-red-500">*</span>
        </label>
        <select
          value={villageId}
          onChange={(e) => {
            const selected = villages.find(v => v.id === e.target.value);
            onVillageChange(e.target.value, selected?.name || '');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!districtId || loadingVillages}
          required
        >
          <option value="">Pilih Kelurahan/Desa</option>
          {villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>
        {loadingVillages && <p className="text-xs text-gray-500 mt-1">Memuat...</p>}
      </div>
    </div>
  );
}
