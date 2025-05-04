"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid or missing verification parameters.");
      return;
    }
    // Call API to verify
    const verify = async () => {
      try {
        setStatus("pending");
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Your email has been verified! You can now log in.");
          // Redirect to login after short delay
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Server error during verification.");
      }
    };
    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#181824] via-[#232946] to-[#0f0f1a]">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10 transition-all duration-300">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 drop-shadow-lg">
            Email Verification
          </h2>
          {status === "pending" && (
            <div className="mt-4 text-blue-200">Verifying your email, please wait...</div>
          )}
          {status === "success" && (
            <div className="mt-4 py-2 px-4 rounded-md bg-green-600/60 text-green-100">
              <p className="text-sm">{message}</p>
              <p className="text-xs mt-2">Redirecting to login...</p>
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 py-2 px-4 rounded-md bg-red-600/60 text-red-100">
              <p className="text-sm">{message}</p>
              <p className="mt-2 text-xs">
                <Link href="/login" className="text-blue-300 underline">Return to login</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
