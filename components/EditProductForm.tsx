"use client";

import { useState, useActionState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { updateProduct, type ActionState } from "@/lib/actions";
import { validatePrice, formatPrice, parsePrice } from "@/lib/currency";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  tags?: string;
}

const CATEGORIES = [
  { group: "Fashion", options: ["Men's Apparel", "Women's Apparel", "Footwear", "Jewelry & Accessories", "Bags & Wallets"] },
  { group: "Electronics", options: ["Smartphones & Tablets", "Computers & Laptops", "Audio & Headphones", "Cameras & Photography", "Gadgets & Wearables"] },
  { group: "Home & Living", options: ["Furniture", "Kitchenware", "Home Decor", "Appliances", "Garden & Outdoor"] },
  { group: "Food", options: ["Food"] },
  { group: "Automotive", options: ["Automotive"] },
  { group: "Other", options: ["Other"] }
];

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export default function EditProductForm({ product }: { product: Product }) {
  const isCustomCategory = !CATEGORIES.flatMap(c => c.options).includes(product.category);
  
  // Create a bound version of updateProduct that includes the productId
  const updateProductWithId = updateProduct.bind(null, product.id);
  const [state, formAction, isPending] = useActionState(updateProductWithId, initialState);

  const [name, setName] = useState(product.name || "");
  const [category, setCategory] = useState(isCustomCategory ? "Other" : product.category);
  const [otherCategory, setOtherCategory] = useState(isCustomCategory ? product.category : "");
  const [tags, setTags] = useState(product.tags || "");
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price.replace(/[^\d.,]/g, ''));
  const [priceError, setPriceError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success("Product updated successfully!");
      router.push(`/products/${product.id}`);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router, product.id]);

  const showOtherCategoryInput = category === "Other";
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPrice(value);
    
    if (!value.trim()) {
      setPriceError("Price is required");
      return;
    }
    
    const validation = validatePrice(value, { min: 1, max: 10000000 });
    setPriceError(validation.error || null);
  };

  const getPricePreview = (): string | null => {
    if (!price) return null;
    const parsed = parsePrice(price);
    if (parsed <= 0) return null;
    return formatPrice(parsed);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setFileError(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File is too large. Please upload an image smaller than 4MB.');
      return;
    }

    setFileError(null);
  };

  const handleSubmit = (formData: FormData) => {
    if (fileError || priceError) {
      toast.error("Please fix errors before submitting.");
      return;
    }
    
    // Normalize and format the price before submission
    const normalizedPrice = formatPrice(price);
    formData.set('price', normalizedPrice);
    
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
          Product Name
        </label>
        <div className="flex items-center justify-between mb-2">
          <span></span>
          <span className="text-xs text-zinc-500">{name.length}/100</span>
        </div>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g., Vintage Camera"
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="price" className="block text-sm font-medium text-zinc-700">
              Price (Pesos)
            </label>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Limit: ₱1 - ₱10M
            </span>
          </div>
          <div className="relative mb-2">
            <span className="absolute left-4 top-3 text-zinc-500 font-medium">₱</span>
            <input
              type="text"
              id="price"
              name="price"
              value={price}
              onChange={handlePriceChange}
              required
              maxLength={16}
              placeholder="1500 or 1,500.00"
              className={`block w-full rounded-lg border px-4 py-3 pl-8 text-zinc-900 focus:ring-blue-500 focus:outline-none sm:text-sm transition-colors ${
                priceError
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-zinc-300 focus:border-blue-500'
              }`}
            />
          </div>
          {priceError && (
            <p className="text-xs font-semibold text-red-600 mb-1">{priceError}</p>
          )}
          {getPricePreview() && !priceError && (
            <p className="text-xs text-green-600 font-medium">Preview: {getPricePreview()}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {CATEGORIES.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {showOtherCategoryInput && (
        <div>
          <label htmlFor="other_category" className="block text-sm font-medium text-zinc-700 mb-1">
            Specify Other Category
          </label>
          <input
            type="text"
            id="other_category"
            name="other_category"
            value={otherCategory}
            onChange={(event) => setOtherCategory(event.target.value)}
            required={showOtherCategoryInput}
            maxLength={50}
            placeholder="e.g., Art Collectibles"
            className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">{otherCategory.length}/50</p>
        </div>
      )}

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-zinc-700 mb-1">
          Tags
        </label>
        <div className="flex items-center justify-between mb-2">
          <span></span>
          <span className="text-xs text-zinc-500">{tags.length}/200</span>
        </div>
        <input
          type="text"
          id="tags"
          name="tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          maxLength={200}
          placeholder="#secondhand, #vintage, #limited"
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        <p className="mt-2 text-xs text-zinc-500">Enter comma-separated tags.</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
          Description
        </label>
        <div className="flex items-center justify-between mb-2">
          <span></span>
          <span className="text-xs text-zinc-500">{description.length}/2000</span>
        </div>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          required
          maxLength={2000}
          placeholder="Describe your product in detail..."
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-zinc-700 mb-1">
          Product Image (Optional - Keep current image if blank)
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-zinc-500 italic">Upload a new photo only if you want to replace the current one.</p>
        {fileError && <p className="mt-2 text-xs font-semibold text-red-600">{fileError}</p>}
      </div>

      <div className="pt-4 flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-full border border-zinc-300 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || Boolean(fileError) || Boolean(priceError)}
          className="flex-1 rounded-full bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Updating...' : 'Update Product'}
        </button>
      </div>
    </form>
  );
}
