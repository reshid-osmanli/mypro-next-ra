// ============================================================================
// components/seo/json-ld.tsx — Server component to inject JSON-LD
// ----------------------------------------------------------------------------
// New file: /components/seo/json-ld.tsx
// ============================================================================

type Props = {
  data: object | object[];
  id?: string;
};

export function JsonLd({ data, id = "json-ld" }: Props) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((entry, i) => (
        <script
          key={`${id}-${i}`}
          type="application/ld+json"
          id={i === 0 ? id : `${id}-${i}`}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
