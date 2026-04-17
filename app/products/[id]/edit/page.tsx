import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import pool from "@/lib/db";
import EditProductForm from "@/components/EditProductForm";
import { RowDataPacket } from "mysql2";

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  tags?: string;
  seller_id: number;
}

async function getProduct(id: string) {
  try {
    const [rows] = await pool.query<ProductRow[]>(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error("Error fetching product for edit:", error);
    return null;
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=/products/${id}/edit`);
  }

  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  if (product.seller_id.toString() !== session.user?.id) {
    redirect(`/products/${id}`);
  }

  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Edit Product</h1>
            <p className="mt-2 text-zinc-600">Update your product information.</p>
          </div>

          <EditProductForm product={product} />
        </div>
      </div>
    </div>
  );
}
