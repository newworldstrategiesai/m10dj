import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Embed TipJar - TipJar.Live',
  description: 'Embed TipJar on your website with one line of code. Works on WordPress, Wix, Squarespace, and any website.',
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


