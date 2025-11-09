"use client";

import Link from "next/link";
import { Search, Gauge, MessageSquare /*, Github*/ } from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";

export default function Header() {
  const { isBackendUp, loading } = useBackendHealth();

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Backend Status Banner */}
      {!loading && !isBackendUp && (
        <div className="w-full bg-red-600 text-white text-center py-2 text-sm font-medium">
          Backend apagado
        </div>
      )}
      
      <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Título / Logo */}
        <Link href="/" className="text-lg sm:text-xl font-light text-black hover:text-gray-700 transition-colors">
          MIMIC-IV Analytics
        </Link>
        
        {/* Navegación */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="p-2 text-gray-600 hover:text-black transition-colors"
            title="Dashboard"
          >
            <Gauge size={20} />
          </Link>
          <Link 
            href="/chat" 
            className="p-2 text-gray-600 hover:text-black transition-colors"
            title="Chat"
          >
            <MessageSquare size={20} />
          </Link>
          <Link 
            href="/search" 
            className="p-2 text-gray-600 hover:text-black transition-colors"
            title="Buscar paciente"
          >
            <Search size={20} />
          </Link>
          {/* <Link 
            href="https://github.com/Angeloyo/TFG" 
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-600 hover:text-black transition-colors"
            title="Repositorio de GitHub"
          >
            <Github size={20} />
          </Link> */}
        </div>
      </div>
    </header>
    </div>
  );
} 