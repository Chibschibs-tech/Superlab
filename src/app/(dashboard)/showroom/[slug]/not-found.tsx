import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-800/50">
        <SearchX className="h-10 w-10 text-neutral-500" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">Projet introuvable</h1>
      <p className="mt-2 text-neutral-400">
        Ce projet n&apos;existe pas ou a été supprimé.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/showroom">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Showroom
        </Link>
      </Button>
    </div>
  );
}

