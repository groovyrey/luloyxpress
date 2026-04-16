"use client";

import { useState } from "react";

type CreateProductAction = (formData: FormData) => Promise<void>;

interface SellProductFormProps {
  action: CreateProductAction;
}

export default function SellProductForm({ action }: SellProductFormProps) {
  const [category, setCategory] = useState("Men's Apparel");
  const [otherCategory, setOtherCategory] = useState("");

  const showOtherCategoryInput = category === "Other";

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
          Product Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="e.g., Vintage Camera"
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-zinc-700 mb-1">
            Price (Pesos)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-zinc-500 font-medium">₱</span>
            <input
              type="text"
              id="price"
              name="price"
              required
              placeholder="1,500.00"
              className="block w-full rounded-lg border border-zinc-300 pl-8 pr-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
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
            <optgroup label="Fashion">
              <option value="Men's Apparel">Men's Apparel</option>
              <option value="Women's Apparel">Women's Apparel</option>
              <option value="Footwear">Footwear</option>
              <option value="Jewelry & Accessories">Jewelry & Accessories</option>
              <option value="Bags & Wallets">Bags & Wallets</option>
            </optgroup>
            <optgroup label="Electronics">
              <option value="Smartphones & Tablets">Smartphones & Tablets</option>
              <option value="Computers & Laptops">Computers & Laptops</option>
              <option value="Audio & Headphones">Audio & Headphones</option>
              <option value="Cameras & Photography">Cameras & Photography</option>
              <option value="Gadgets & Wearables">Gadgets & Wearables</option>
            </optgroup>
            <optgroup label="Home & Living">
              <option value="Furniture">Furniture</option>
              <option value="Kitchenware">Kitchenware</option>
              <option value="Home Decor">Home Decor</option>
              <option value="Appliances">Appliances</option>
              <option value="Garden & Outdoor">Garden & Outdoor</option>
            </optgroup>
            <optgroup label="Food">
              <option value="Food">Food</option>
            </optgroup>
            <optgroup label="Other">
              <option value="Other">Other</option>
            </optgroup>
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
            placeholder="e.g., Art Collectibles"
            className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      )}

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-zinc-700 mb-1">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          placeholder="#secondhand, #vintage, #limited"
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        <p className="mt-2 text-xs text-zinc-500">Enter comma-separated tags. Prefix will be added automatically if missing.</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder="Describe your product in detail..."
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-zinc-700 mb-1">
          Product Image
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          required
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-zinc-500 italic">Upload a clear photo of your product.</p>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full rounded-full bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          List Product for Sale
        </button>
      </div>
    </form>
  );
}
