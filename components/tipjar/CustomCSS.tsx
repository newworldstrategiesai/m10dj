'use client';

interface CustomCSSProps {
  css: string;
}

export default function CustomCSS({ css }: CustomCSSProps) {
  if (!css) return null;
  
  return (
    <style jsx global>{`
      ${css}
    `}</style>
  );
}

