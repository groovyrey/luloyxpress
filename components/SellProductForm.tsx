"use client";

import { useState, useActionState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createProduct, type ActionState } from "@/lib/actions";
import { validatePrice, formatPrice, parsePriceToDecimal } from "@/lib/currency";
import { toast } from "sonner";

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export default function SellProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, initialState);
  const [category, setCategory] = useState("Men's Apparel");
  const [otherCategory, setOtherCategory] = useState("");
  const [tags, setTags] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const addTag = (value: string) => {
    const cleanTag = value.trim().replace(/,/g, "");
    if (!cleanTag) return;
    
    const formattedTag = cleanTag.startsWith("#") ? cleanTag : `#${cleanTag}`;
    if (!tagList.includes(formattedTag)) {
      const newTagList = [...tagList, formattedTag];
      setTagList(newTagList);
      setTags(newTagList.join(", "));
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    const newTagList = tagList.filter(tag => tag !== tagToRemove);
    setTagList(newTagList);
    setTags(newTagList.join(", "));
  };

  const handleTagInput = (value: string) => {
    // If the user typed a space or comma, add the tag immediately
    if (value.endsWith(" ") || value.endsWith(",")) {
      addTag(value.slice(0, -1));
    } else {
      setTagInput(value);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tagList.length > 0) {
      removeTag(tagList[tagList.length - 1]);
    }
  };
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success("Product listed successfully!");
      router.push('/shop');
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

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
    const decimal = parsePriceToDecimal(price);
    if (decimal <= 0) return null;
    return formatPrice(decimal);
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
    
    // Send clean decimal string to the server
    const numericPrice = parsePriceToDecimal(price).toFixed(2);
    formData.set('price', numericPrice);
    
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
          <span className="text-xs text-zinc-500">0/100</span>
        </div>
        <input
          type="text"
          id="name"
          name="name"
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
            <optgroup label="Fashion">
              <option value="Men&apos;s Apparel">Men&apos;s Apparel</option>
              <option value="Women&apos;s Apparel">Women&apos;s Apparel</option>
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
            <optgroup label="Automotive">
              <option value="Automotive">Automotive</option>
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
            maxLength={50}
            placeholder="e.g., Art Collectibles"
            className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">{otherCategory.length}/50</p>
        </div>
      )}

      <div>
        <label htmlFor="tags-input" className="block text-sm font-medium text-zinc-700 mb-1">
          Tags
        </label>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Press Space or Comma to add</span>
          <span className="text-xs text-zinc-500">{tags.length}/200</span>
        </div>
        
        <div className="flex flex-wrap gap-2 p-2 min-h-[50px] rounded-lg border border-zinc-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          {tagList.map((tag, index) => (
            <span 
              key={index}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold animate-in zoom-in-50 duration-200 group"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </span>
          ))}
          <input
            type="text"
            id="tags-input"
            value={tagInput}
            onChange={(e) => handleTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => addTag(tagInput)}
            placeholder={tagList.length === 0 ? "#secondhand, #vintage..." : "Add more..."}
            className="flex-1 min-w-[120px] bg-transparent border-none p-1 text-sm focus:outline-none focus:ring-0 text-zinc-900"
          />
        </div>
        
        {/* Hidden input to store the comma-separated string for form submission */}
        <input type="hidden" name="tags" value={tags} />
        
        <p className="mt-2 text-xs text-zinc-500 italic">Example: vintage, limited, aesthetic</p>
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
          Product Image
        </label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-2 text-xs text-zinc-500 italic">Upload a clear photo of your product.</p>
        {fileError && <p className="mt-2 text-xs font-semibold text-red-600">{fileError}</p>}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending || Boolean(fileError) || Boolean(priceError)}
          className="w-full rounded-full bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Listing product...' : 'List Product for Sale'}
        </button>
      </div>
    </form>
  );
}
