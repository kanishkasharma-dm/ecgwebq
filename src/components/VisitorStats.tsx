import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface CountryData {
  name: string;
  percentage: number;
  count: number;
}

interface VisitorStats {
  totalVisitors: number;
  countries: CountryData[];
  timestamp?: number;
}

export function VisitorStats() {
  const [stats, setStats] = useState<VisitorStats>({ totalVisitors: 0, countries: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch analytics from Vercel API
  const fetchVercelAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data); // Debug log
        if (data.visitors !== undefined) {
          // Ensure countries array has proper structure with valid percentages
          const countries = Array.isArray(data.countries) 
            ? data.countries
                .filter((c: any) => c && (c.name || c)) // Filter out invalid entries
                .map((c: any) => {
                  const name = c.name || c || 'Unknown';
                  const count = typeof c.count === 'number' ? c.count : 0;
                  const totalVisitors = data.visitors || 0;
                  const percentage = totalVisitors > 0 && count > 0
                    ? Math.round((count / totalVisitors) * 100)
                    : (typeof c.percentage === 'number' && !isNaN(c.percentage) ? c.percentage : 0);
                  
                  return {
                    name: name,
                    percentage: isNaN(percentage) ? 0 : percentage,
                    count: count
                  };
                })
                .filter((c: CountryData) => c.name && c.name !== 'Unknown' && c.count > 0) // Remove invalid entries
            : [];
          
          setStats({
            totalVisitors: data.visitors || 0,
            countries: countries,
            timestamp: data.timestamp,
          });
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch Vercel analytics:', error);
    }

    // Fallback: Get visitor's country and track locally
    try {
      let countryName = '';
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        countryName = data.country_name || '';
      } catch (e) {
        try {
          const response = await fetch('https://ip-api.com/json/');
          const data = await response.json();
          countryName = data.country || '';
        } catch (e2) {
          // Continue without country
        }
      }

      // Update visitor stats locally
      const storedStats = localStorage.getItem('visitorStats');
      let visitorStats: VisitorStats = storedStats 
        ? JSON.parse(storedStats) 
        : { totalVisitors: 0, countries: [] };

      // Check if this is a new session
      const lastSession = sessionStorage.getItem('lastVisit');
      const now = Date.now();
      
      // Only count as new visitor if last visit was more than 30 minutes ago
      if (!lastSession || now - parseInt(lastSession) > 30 * 60 * 1000) {
        sessionStorage.setItem('lastVisit', now.toString());
        visitorStats.totalVisitors += 1;

        // Add country with proper structure
        if (countryName) {
          const existingCountry = visitorStats.countries.find(c => c.name === countryName);
          if (existingCountry) {
            existingCountry.count += 1;
          } else {
            visitorStats.countries.push({
              name: countryName,
              count: 1,
              percentage: 0
            });
          }
          
          // Recalculate percentages and filter valid countries
          visitorStats.countries = visitorStats.countries
            .filter(country => country && country.name && country.name !== 'Unknown' && country.count > 0)
            .map(country => {
              const percentage = visitorStats.totalVisitors > 0 && country.count > 0
                ? Math.round((country.count / visitorStats.totalVisitors) * 100)
                : 0;
              return {
                ...country,
                percentage: isNaN(percentage) ? 0 : percentage,
                count: typeof country.count === 'number' ? country.count : 0
              };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        }

        localStorage.setItem('visitorStats', JSON.stringify(visitorStats));
      } else {
        // Even if not a new session, recalculate percentages from stored data
        visitorStats.countries = visitorStats.countries
          .filter(country => country && country.name && country.name !== 'Unknown' && country.count > 0)
          .map(country => {
            const percentage = visitorStats.totalVisitors > 0 && country.count > 0
              ? Math.round((country.count / visitorStats.totalVisitors) * 100)
              : 0;
            return {
              ...country,
              percentage: isNaN(percentage) ? 0 : percentage,
              count: typeof country.count === 'number' ? country.count : 0
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      setStats(visitorStats);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load stored stats immediately for instant display
    const storedStats = localStorage.getItem('visitorStats');
    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        if (parsed.countries && Array.isArray(parsed.countries) && parsed.countries.length > 0) {
          // Recalculate percentages and filter valid countries
          const countriesWithPercentages = parsed.countries
            .filter((country: any) => country && country.name && country.name !== 'Unknown' && typeof country.count === 'number' && country.count > 0)
            .map((country: CountryData) => {
              const count = typeof country.count === 'number' ? country.count : 0;
              const totalVisitors = typeof parsed.totalVisitors === 'number' ? parsed.totalVisitors : 0;
              const percentage = totalVisitors > 0 && count > 0
                ? Math.round((count / totalVisitors) * 100)
                : 0;
              return {
                name: country.name || 'Unknown',
                percentage: isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage)),
                count: count
              };
            })
            .sort((a: CountryData, b: CountryData) => b.count - a.count);
          
          if (countriesWithPercentages.length > 0) {
            setStats({
              totalVisitors: parsed.totalVisitors || 0,
              countries: countriesWithPercentages,
            });
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error('Failed to parse stored stats:', e);
      }
    }

    // Initial fetch
    fetchVercelAnalytics();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchVercelAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-brand-electric flex-shrink-0" />
        <p className="text-xs uppercase tracking-[0.35em] text-white/40 whitespace-nowrap">
          Live Visitors
        </p>
        {!isLoading && (
          <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-green-500 flex-shrink-0" />
        )}
      </div>
      <div className="space-y-2 w-full">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-display text-2xl text-white">
            {isLoading ? '...' : stats.totalVisitors.toLocaleString()}
          </span>
          <span className="text-xs text-white/60 whitespace-nowrap">visitors</span>
        </div>
      </div>
    </div>
  );
}
