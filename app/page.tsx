'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SearchForm } from '@/components/search-form';
import { Bus, CheckCircle2, Shield, Headphones, Users, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

interface Operator {
  id: string;
  name: string;
  logo_url: string | null;
}

interface TripWithRoute {
  id: string;
  base_price: number;
  routes: {
    from_city: { name: string }[] | { name: string };
    to_city: { name: string }[] | { name: string };
  } | null;
}

export default function HomePage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [popularTrips, setPopularTrips] = useState<TripWithRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const features = [
    {
      icon: Users,
      title: t('operatorsTitle'),
      description: t('operatorsDesc'),
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Clock,
      title: t('instantBookingTitle'),
      description: t('instantBookingDesc'),
      color: 'from-teal-500 to-teal-600',
    },
    {
      icon: Shield,
      title: t('securePaymentTitle'),
      description: t('securePaymentDesc'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Headphones,
      title: t('helpTitle'),
      description: t('helpDesc'),
      color: 'from-purple-500 to-purple-600',
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get operators with logos
      const { data: operatorsData } = await supabase
        .from('operators')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .limit(30);

      // Get popular routes with trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          id,
          base_price,
          routes (
            from_city:from_city_id (name),
            to_city:to_city_id (name)
          )
        `)
        .eq('status', 'scheduled')
        .limit(8);

      setOperators(operatorsData || []);
      setPopularTrips((tripsData as unknown as TripWithRoute[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique routes from trips
  const uniqueRoutes = Array.from(new Map(
    popularTrips.map(trip => {
      const fromCity = trip.routes?.from_city;
      const toCity = trip.routes?.to_city;
      const from = Array.isArray(fromCity) ? fromCity[0]?.name || '' : fromCity?.name || '';
      const to = Array.isArray(toCity) ? toCity[0]?.name || '' : toCity?.name || '';
      const key = `${from}-${to}`;
      return [key, { from, to, price: trip.base_price }];
    })
  ).values()).slice(0, 4);

  // Route images from Pexels (stock photos)
  const routeImages: Record<string, string> = {
    'Yangon-Mandalay': 'https://images.pexels.com/photos/28928872/pexels-photo-28928872.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Yangon-Bagan': 'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Yangon-Naypyitaw': 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Yangon-Taunggyi': 'https://images.pexels.com/videos/3668289/pexels-photo-3668289.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Yangon-Mawlamyine': 'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Yangon-Pathein': 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800',
    'default': 'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=800',
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Hero Text */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-white">{t('heroTitle')}</span>
              <br />
              <span className="gradient-text">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10 animate-slide-up">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-teal-400" />
              <span>{t('preferredSeat')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-teal-400" />
              <span>{t('instantConfirmation')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-teal-400" />
              <span>{t('overOperators')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-teal-400" />
              <span>{t('support247')}</span>
            </div>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('popularRoutes')}</h2>
            <p className="text-slate-400">{t('popularRoutesDesc')}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-800 rounded-xl animate-pulse h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {uniqueRoutes.map((route, index) => {
                const imageKey = `${route.from}-${route.to}`;
                const image = routeImages[imageKey] || routeImages['default'];
                return (
                  <Link
                    key={index}
                    href={`/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`}
                    className="relative group rounded-xl overflow-hidden"
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={image}
                        alt={`${route.from} to ${route.to}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 text-white mb-2">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <span className="font-semibold">{route.from} - {route.to}</span>
                      </div>
                      <div className="text-teal-400 text-sm font-medium">
                        From MMK {formatPrice(route.price)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Operators Section */}
      <section className="py-16 border-t border-slate-800/50 bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('operatorsSectionTitle')}</h2>
            <p className="text-slate-400">{t('operatorsSectionDesc')}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-xl animate-pulse h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {operators.map((operator) => (
                <div
                  key={operator.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 flex items-center justify-center hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {operator.logo_url ? (
                      <img
                        src={operator.logo_url}
                        alt={operator.name}
                        className="w-10 h-10 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                        <Bus className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <span className="text-sm text-slate-200 font-medium truncate">{operator.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">{t('weAccept')}</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['VISA', 'MasterCard', 'MPU', 'WavePay', 'KBZPay', 'CBPay', 'AYAPay'].map((payment, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg px-6 py-3 border border-slate-700/50 text-slate-300 font-medium"
                >
                  {payment}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{t('haveQuestions')}</h2>
            <p className="text-slate-400 mb-6">
              {t('faqDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/help"
                className="btn-primary px-6 py-3 rounded-lg"
              >
                {t('bookingFAQs')}
              </Link>
              <Link
                href="/help"
                className="btn-secondary px-6 py-3 rounded-lg"
              >
                {t('paymentFAQs')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
