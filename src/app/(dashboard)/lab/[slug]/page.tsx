import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LabProjectPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Redirect to the edit page
  redirect(`/lab/${slug}/edit`);
}
