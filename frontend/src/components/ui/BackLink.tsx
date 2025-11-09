"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BackLink() {
  return (
    <div className="mb-8">
      <Link 
        href="/dashboard" 
        className="flex items-center text-gray-600 hover:text-gray-800 gap-2 group"
      >
        <ArrowLeft className="w-3 h-3 text-gray-400 group-hover:text-gray-600 group-hover:-translate-x-1 transition-all duration-200" />
        <span className="text-sm font-light">
          Volver
        </span>
      </Link>
    </div>
  );
}


