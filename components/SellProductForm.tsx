"use client";

import { useState, useActionState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createProduct, type ActionState } from "@/lib/actions";
import { validatePrice, formatPrice, parsePriceToDecimal } from "@/lib/currency";
import { toast } from "sonner";
import { 
  Plus, 
  X, 
  Upload, 
  Tag as TagIcon, 
  Info, 
  AlertCircle,
  Package,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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
  const [name, setName] = useState("");

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
    
    const numericPrice = parsePriceToDecimal(price).toFixed(2);
    formData.set('price', numericPrice);
    formData.set('category', category);
    
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Product Name
            </Label>
            <span className={`text-[10px] font-bold ${name.length > 90 ? 'text-orange-500' : 'text-zinc-400'}`}>
              {name.length}/100
            </span>
          </div>
          <Input
            id="name"
            name="name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Vintage Camera"
            className="h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="price" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Price (Pesos)
              </Label>
              <span className="text-[10px] font-bold text-zinc-400">₱1 - ₱10M</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₱</span>
              <Input
                id="price"
                name="price"
                value={price}
                onChange={handlePriceChange}
                required
                maxLength={16}
                placeholder="1500"
                className={`pl-7 h-12 text-base ${priceError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
            </div>
            {priceError && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" />
                <p className="text-[10px] font-bold uppercase">{priceError}</p>
              </div>
            )}
            {getPricePreview() && !priceError && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <p className="text-[10px] font-bold uppercase">Preview: {getPricePreview()}</p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Category
            </Label>
            <Select value={category} onValueChange={(val) => val && setCategory(val)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fashion</SelectLabel>
                  <SelectItem value="Men's Apparel">Men&apos;s Apparel</SelectItem>
                  <SelectItem value="Women's Apparel">Women&apos;s Apparel</SelectItem>
                  <SelectItem value="Footwear">Footwear</SelectItem>
                  <SelectItem value="Jewelry & Accessories">Jewelry & Accessories</SelectItem>
                  <SelectItem value="Bags & Wallets">Bags & Wallets</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Electronics</SelectLabel>
                  <SelectItem value="Smartphones & Tablets">Smartphones & Tablets</SelectItem>
                  <SelectItem value="Computers & Laptops">Computers & Laptops</SelectItem>
                  <SelectItem value="Audio & Headphones">Audio & Headphones</SelectItem>
                  <SelectItem value="Cameras & Photography">Cameras & Photography</SelectItem>
                  <SelectItem value="Gadgets & Wearables">Gadgets & Wearables</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Home & Living</SelectLabel>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Kitchenware">Kitchenware</SelectItem>
                  <SelectItem value="Home Decor">Home Decor</SelectItem>
                  <SelectItem value="Appliances">Appliances</SelectItem>
                  <SelectItem value="Garden & Outdoor">Garden & Outdoor</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Other</SelectLabel>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Automotive">Automotive</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <input type="hidden" name="category" value={category} />
          </div>
        </div>

        {showOtherCategoryInput && (
          <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="other_category" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Specify Other Category
              </Label>
              <span className="text-[10px] font-bold text-zinc-400">{otherCategory.length}/50</span>
            </div>
            <Input
              id="other_category"
              name="other_category"
              value={otherCategory}
              onChange={(e) => setOtherCategory(e.target.value)}
              required={showOtherCategoryInput}
              maxLength={50}
              placeholder="e.g., Art Collectibles"
              className="h-12"
            />
          </div>
        )}

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Tags
            </Label>
            <span className="text-[10px] font-bold text-zinc-400">
              {tags.length}/200 • SPACE OR COMMA TO ADD
            </span>
          </div>
          <Card className="shadow-none border-zinc-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <CardContent className="p-2 flex flex-wrap gap-2 min-h-[50px]">
              {tagList.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 text-sm font-bold gap-1 animate-in zoom-in-50 duration-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
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
            </CardContent>
          </Card>
          <input type="hidden" name="tags" value={tags} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Description
            </Label>
            <span className="text-[10px] font-bold text-zinc-400">{description.length}/2000</span>
          </div>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            maxLength={2000}
            placeholder="Describe your product in detail..."
            className="text-base resize-none"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="image" className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Product Image
          </Label>
          <div className="relative group">
            <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-zinc-200 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-400 focus:outline-none group-hover:bg-zinc-50">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <span className="font-medium text-zinc-600">
                  Click to upload product image
                </span>
              </div>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3 text-zinc-400" />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Max 4MB • High quality images sell faster</p>
          </div>
          {fileError && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <p className="text-[10px] font-bold uppercase">{fileError}</p>
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="xl"
        disabled={isPending || Boolean(fileError) || Boolean(priceError)}
        className="w-full rounded-full py-8 text-lg font-bold shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Listing product...
          </>
        ) : (
          <>
            <Package className="mr-2 h-5 w-5" />
            List Product for Sale
          </>
        )}
      </Button>
    </form>
  );
}
