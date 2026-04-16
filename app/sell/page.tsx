import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SellProductForm from "@/components/SellProductForm";

export default async function SellPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/sell");
  }

  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Sell your product</h1>
            <p className="mt-2 text-zinc-600">List your item for sale on LuloyXpress.</p>
          </div>

          <SellProductForm />
        </div>
      </div>
    </div>
  );
}
