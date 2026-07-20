'use client';

import React from 'react';
import { Compass, PenSquare } from 'lucide-react';
import { ModuleCard } from '@/components/dashboard/EmpireCards';

export default function MarketingHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Marketing</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Your AI-powered marketing department — brand strategy and content, generated and refined right here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleCard
          title="Brand Strategy"
          description="Answer a short interview and get a full strategy: positioning, personas, SWOT, content pillars, and a 12-month roadmap."
          icon={Compass}
          href="/dashboard/marketing/brand-strategy"
        />
        <ModuleCard
          title="Content Studio"
          description="Generate publish-ready blog posts, social captions, email copy, ad copy, and more — grounded in your brand strategy."
          icon={PenSquare}
          href="/dashboard/marketing/content"
        />
      </div>
    </div>
  );
}
