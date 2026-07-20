import { NextRequest, NextResponse } from 'next/server';
import { getMatchingVehicles } from '@/lib/actions/vehicle-matches.actions';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const matchingVehicles = await getMatchingVehicles(body);

  return NextResponse.json({ matchingVehicles });
}
