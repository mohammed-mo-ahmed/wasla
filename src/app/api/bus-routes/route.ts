import {NextResponse} from 'next/server';
import {busRoutes} from '@/shared/ai/data/bus-routes';

export async function GET() {
  return NextResponse.json(busRoutes);
}
