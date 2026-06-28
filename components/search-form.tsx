'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, ArrowRight, ArrowLeftRight, Search, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { City } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';
import { format } from 'date-fns';

interface SearchFormProps {
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  compact?: boolean;
}

export function SearchForm({ initialFrom, initialTo, initialDate, compact = false }: SearchFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isForeigner, setIsForeigner] = useState(false);
  const [numberOfSeats, setNumberOfSeats] = useState(1);

  const [fromCity, setFromCity] = useState(initialFrom || '');
  const [toCity, setToCity] = useState(initialTo || '');
  const [departureDate, setDepartureDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  useEffect(() => {
    async function fetchCities() {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .order('is_popular', { ascending: false })
          .order('name', { ascending: true });

        if (error) throw error;
        setCities(data || []);

        if (!initialFrom && data?.length) {
          setFromCity('Yangon');
        }
        if (!initialTo && data?.length) {
          setToCity('Mandalay');
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, [initialFrom, initialTo]);

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity || !toCity || !departureDate) return;

    const params = new URLSearchParams({
      from: fromCity,
      to: toCity,
      date: departureDate,
      seats: numberOfSeats.toString(),
      foreigner: isForeigner.toString(),
    });

    router.push(`/search?${params.toString()}`);
  };

  const popularCities = cities.filter(c => c.is_popular);

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-end">
          {/* From */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t('from')}
            </label>
            <select
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="w-full input-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              required
            >
              <option value="">{t('selectCity')}</option>
              {popularCities.length > 0 && (
                <optgroup label={language === 'my' ? 'လူကြိုက်များ' : 'Popular'}>
                  {popularCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name_mm || city.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={language === 'my' ? 'မြို့အားလုံး' : 'All Cities'}>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name_mm || city.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={swapCities}
            className="hidden md:flex items-center justify-center p-2 hover:bg-slate-700/50 rounded-lg transition-colors self-end mb-0.5"
          >
            <ArrowLeftRight className="h-5 w-5 text-teal-400" />
          </button>

          {/* To */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t('to')}
            </label>
            <select
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="w-full input-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              required
            >
              <option value="">{t('selectCity')}</option>
              {popularCities.length > 0 && (
                <optgroup label={language === 'my' ? 'လူကြိုက်များ' : 'Popular'}>
                  {popularCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name_mm || city.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={language === 'my' ? 'မြို့အားလုံး' : 'All Cities'}>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name_mm || city.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {language === 'my' ? 'ရက်စွဲ' : 'Date'}
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full input-dark rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              required
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="btn-primary w-full rounded-lg py-2.5 flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>{t('searchBuses')}</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-4 sm:p-6 md:p-8">
      {/* Traveller Type Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <button
          type="button"
          onClick={() => setIsForeigner(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !isForeigner
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Users className="h-4 w-4 mr-2 inline" />
          {language === 'my' ? 'ပြည်တွင်းခရီးသွား' : 'Local Traveller'}
        </button>
        <button
          type="button"
          onClick={() => setIsForeigner(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isForeigner
              ? 'bg-teal-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Globe className="h-4 w-4 mr-2 inline" />
          {language === 'my' ? 'နိုင်ငံခြားခရီးသွား' : 'Foreign Traveller'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          {/* From City */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium">{t('from')}</label>
            <select
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="w-full input-dark rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              required
            >
              <option value="">{language === 'my' ? 'ထွက်ရာမြို့ရွေးပါ' : 'Select departure city'}</option>
              {popularCities.length > 0 && (
                <optgroup label={language === 'my' ? 'လူကြိုက်များ' : 'Popular'}>
                  {popularCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name_mm || city.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={language === 'my' ? 'မြို့အားလုံး' : 'All Cities'}>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name_mm || city.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pb-2 hidden md:flex">
            <button
              type="button"
              onClick={swapCities}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all hover:scale-110 border border-slate-600"
            >
              <ArrowLeftRight className="h-5 w-5 text-teal-400" />
            </button>
          </div>

          {/* Mobile Swap button */}
          <button
            type="button"
            onClick={swapCities}
            className="md:hidden flex items-center justify-center gap-2 py-2 text-teal-400 hover:text-teal-300"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-sm">{language === 'my' ? 'ပြောင်းပါ' : 'Swap'}</span>
          </button>

          {/* To City */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium">{t('to')}</label>
            <select
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="w-full input-dark rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              required
            >
              <option value="">{language === 'my' ? 'ရောက်ရာမြို့ရွေးပါ' : 'Select arrival city'}</option>
              {popularCities.length > 0 && (
                <optgroup label={language === 'my' ? 'လူကြိုက်များ' : 'Popular'}>
                  {popularCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name_mm || city.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={language === 'my' ? 'မြို့အားလုံး' : 'All Cities'}>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name_mm || city.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Departure Date */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" />
              {t('departureDate')}
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full input-dark rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              required
            />
          </div>

          {/* Number of Seats */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-400" />
              {t('passengers')}
            </label>
            <select
              value={numberOfSeats}
              onChange={(e) => setNumberOfSeats(parseInt(e.target.value))}
              className="w-full input-dark rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} {language === 'my' ? 'နေရာ' : `seat${n > 1 ? 's' : ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading || !fromCity || !toCity}
          className="w-full btn-primary rounded-xl py-4 sm:py-5 text-base sm:text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-5 w-5" />
          <span>{language === 'my' ? 'ယခုရှာရန်' : 'Search Now'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
