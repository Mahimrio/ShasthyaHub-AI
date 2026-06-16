export async function GET() {
  return Response.json({ message: 'Reports endpoint' });
}

export async function POST() {
  return Response.json({ message: 'Create report endpoint' });
}