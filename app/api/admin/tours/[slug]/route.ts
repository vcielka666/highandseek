import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { connectDB } from '@/lib/db/connect'
import Tour from '@/lib/db/models/Tour'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { slug } = await params
  await connectDB()

  const tour = await Tour.findOne({ slug }).lean()
  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  return NextResponse.json({ tour })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { slug } = await params
  const raw = await req.json()

  await connectDB()

  const tour = await Tour.findOneAndUpdate(
    { slug },
    { $set: raw },
    { new: true, runValidators: true }
  ).lean()

  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  return NextResponse.json({ tour })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { slug } = await params
  await connectDB()

  const tour = await Tour.findOneAndDelete({ slug }).lean()
  if (!tour) {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
