import Image from "next/image";

export default function Home() {
  const products = [
    {
      id: 1,
      name: "Classic Leather Backpack",
      price: "$89.00",
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
      id: 2,
      name: "Wireless Noise-Canceling Headphones",
      price: "$249.00",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
      id: 3,
      name: "Minimalist Ceramic Vase",
      price: "$45.00",
      category: "Home Decor",
      image: "https://images.unsplash.com/photo-1581557991964-125469da3b8a?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
      id: 4,
      name: "Organic Cotton T-Shirt",
      price: "$32.00",
      category: "Apparel",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400&h=400",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold tracking-tighter text-black">
              LULOY<span className="text-blue-600">XPRESS</span>
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <a href="#" className="hover:text-black transition-colors">Shop All</a>
              <a href="#" className="hover:text-black transition-colors">New Arrivals</a>
              <a href="#" className="hover:text-black transition-colors">Categories</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-600 hover:text-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button className="p-2 text-zinc-600 hover:text-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-zinc-100 py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative z-10 max-w-2xl">
              <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-blue-600">
                Summer Collection 2026
              </span>
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
                Style that speaks <br /> 
                <span className="text-blue-600">for itself.</span>
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-zinc-600">
                Discover our curated selection of premium products designed for the modern lifestyle. Quality meets elegance in every piece.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="#" className="inline-flex h-14 items-center justify-center rounded-full bg-black px-8 text-base font-semibold text-white transition-all hover:bg-zinc-800">
                  Shop Now
                </a>
                <a href="#" className="inline-flex h-14 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-base font-semibold text-black transition-all hover:bg-zinc-50">
                  View Lookbook
                </a>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 hidden h-full w-1/2 lg:block">
            <div className="h-full w-full bg-gradient-to-l from-blue-100 to-transparent"></div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-black">Featured Products</h2>
                <p className="mt-2 text-zinc-600">Our most popular items this season.</p>
              </div>
              <a href="#" className="hidden text-sm font-semibold text-blue-600 hover:text-blue-700 sm:block">
                View all products &rarr;
              </a>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-zinc-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                    />
                    <button className="absolute bottom-4 left-4 right-4 translate-y-12 rounded-xl bg-white/90 py-3 text-sm font-bold text-black opacity-0 backdrop-blur-sm transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      Quick Add
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{product.category}</p>
                    <h3 className="mt-1 text-base font-semibold text-black">{product.name}</h3>
                    <p className="mt-1 text-sm font-bold text-blue-600">{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-black py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Join the club</h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full max-w-xs rounded-full border border-zinc-800 bg-zinc-900 px-6 py-3 text-white focus:border-blue-500 focus:outline-none sm:w-80"
              />
              <button className="w-full max-w-xs rounded-full bg-white px-8 py-3 font-bold text-black transition-colors hover:bg-zinc-200 sm:w-auto">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">
            &copy; 2026 LuloyXpress. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
