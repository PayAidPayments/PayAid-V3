'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Back to Apps Button
 * Used in module pages to navigate back to the landing page
 */
export function BackToApps() {
  return (
    <Link href="/home">
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Apps
      </Button>
    </Link>
  );
}

