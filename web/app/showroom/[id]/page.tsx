import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ToyotaHeader } from "@/components/layout/toyota-header";
import { ToyotaFooter } from "@/components/layout/toyota-footer";
import { ShowroomViewer } from "@/components/showroom/ShowroomViewer";

type ToyotaTrimSpec = {
  trim_id: number;
  model_year: number;
  make: string;
  model: string;
  trim: string;
  image_url: string;
};

export default async function ShowroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trimId = parseInt(id, 10);

  if (Number.isNaN(trimId)) {
    notFound();
  }

  const supabase = createSupabaseServerClient();
  const { data: trimSpec, error } = await supabase
    .from("toyota_trim_specs")
    .select("trim_id, model_year, make, model, trim, image_url")
    .eq("trim_id", trimId)
    .single<ToyotaTrimSpec>();

  if (error || !trimSpec) {
    notFound();
  }

  const vehicleName = `${trimSpec.model_year} ${trimSpec.make} ${trimSpec.model} ${trimSpec.trim}`;

  return (
    <div className="flex min-h-screen flex-col">
      <ToyotaHeader />
      <main className="flex-1">
        <ShowroomViewer
          trimId={trimSpec.trim_id}
          vehicleName={vehicleName}
          imageUrl={trimSpec.image_url}
        />
      </main>
      <ToyotaFooter />
    </div>
  );
}

