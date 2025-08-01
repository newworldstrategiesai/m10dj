// Mark this route as dynamic to avoid static generation issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Skip static generation for this authenticated route
export const generateStaticParams = () => {
  return [];
}
