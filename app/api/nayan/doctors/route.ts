import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty') ?? 'Ophthalmologist'
    const district = searchParams.get('district') ?? 'Dhaka'

    let { data: doctors } = await supabase
      .from('doctors')
      .select('*')
      .eq('specialty', specialty)
      .eq('district', district)
      .order('rating', { ascending: false })
      .limit(3)

    if (!doctors || doctors.length === 0) {
      const { data: allDoctors } = await supabase
        .from('doctors')
        .select('*')
        .eq('specialty', specialty)
        .order('rating', { ascending: false })
        .limit(3)
      doctors = allDoctors
    }

    return NextResponse.json({ success: true, data: doctors ?? [] })
  } catch (error) {
    console.error('[nayan/doctors] failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch doctors', code: 'FETCH_ERROR' }, { status: 500 })
  }
}
