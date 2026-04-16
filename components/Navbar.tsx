import { auth } from "@/auth";
import NavbarClient from "./NavbarClient";
import { getCartCount } from "@/lib/actions";

export default async function Navbar() {
  const session = await auth();
  const cartCount = await getCartCount();

  return <NavbarClient session={session} cartCount={cartCount} />;
}
