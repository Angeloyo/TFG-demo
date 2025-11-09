import type { NextConfig } from "next";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env desde el directorio padre (raíz del proyecto)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
