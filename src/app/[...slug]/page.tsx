import VisualPageBySlug from "@/components/visual/VisualPageBySlug";

export default async function DynamicVisualPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  const slug = `/${(resolved.slug || []).join("/")}`;
  return <VisualPageBySlug slug={slug} />;
}
