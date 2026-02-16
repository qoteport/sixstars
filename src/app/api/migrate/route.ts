
import { NextResponse } from 'next/server';
import { migrateSoftwareToFirestore } from '@/migrations/001-migrate-software';

export async function POST() {
  // In a production environment, you would want to secure this endpoint.
  try {
    const result = await migrateSoftwareToFirestore();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
