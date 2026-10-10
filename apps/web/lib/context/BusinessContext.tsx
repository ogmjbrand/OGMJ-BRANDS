'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, getCurrentSession } from '@/lib/auth';
import { listUserBusinesses } from '@/lib/services/business';
import type { Business, User } from '@/lib/types';

interface BusinessContextType {
  currentBusiness: Business | null;
  businesses: Business[];
  setCurrentBusiness: (business: Business) => void;
  user: User | null;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        // listUserBusinesses() independently re-validates the session itself,
        // so this call and getCurrentUser() don't depend on each other —
        // running them in parallel instead of one after another cuts a full
        // sequential Supabase round trip off the dashboard's cold load.
        const [currentUser, result] = await Promise.all([
          getCurrentUser(),
          listUserBusinesses(),
        ]);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser as User);

        if (result.success && result.data) {
          setBusinesses(result.data);
          // Set first business as default
          if (result.data.length > 0) {
            setCurrentBusiness(result.data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load businesses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businesses,
        setCurrentBusiness,
        user,
        loading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within BusinessProvider');
  }
  return context;
}


