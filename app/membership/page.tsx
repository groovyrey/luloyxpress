import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import MembershipButton from "@/components/MembershipButton";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  account_type: string;
}

async function getFullUser(userId: string) {
  try {
    const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE id = ?", [userId]);
    return rows[0];
  } catch {
    return null;
  }
}

export default async function MembershipPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/membership");
  }

  const dbUser = await getFullUser(session.user.id);

  const plans = [
    {
      id: "standard",
      name: "Standard",
      price: "₱0",
      description: "Perfect for casual sellers",
      features: ["Up to 5 active listings", "Standard support", "1% transaction fee"],
      buttonText: dbUser?.account_type === "standard" ? "Current Plan" : "Downgrade to Standard",
      current: dbUser?.account_type === "standard",
    },
    {
      id: "pro",
      name: "Pro",
      price: "₱499",
      description: "For growing businesses",
      features: ["Unlimited listings", "Priority support", "0% transaction fee", "Verified seller badge", "Featured listings"],
      buttonText: dbUser?.account_type === "pro" ? "Current Plan" : "Upgrade to Pro",
      current: dbUser?.account_type === "pro",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight sm:text-5xl">
            Choose your <span className="text-blue-600">selling power.</span>
          </h1>
          <p className="mt-4 text-xl text-zinc-600">
            Scale your business with LuloyXpress Pro membership.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-8 shadow-sm border ${
                plan.current ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-200"
              }`}
            >
              {plan.current && (
                <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-zinc-900">{plan.name}</h3>
                <p className="text-zinc-500 mt-2">{plan.description}</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-zinc-900">{plan.price}</span>
                  <span className="text-zinc-500 ml-1">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-zinc-600">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <MembershipButton 
                planId={plan.id} 
                current={plan.current} 
                buttonText={plan.buttonText} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
