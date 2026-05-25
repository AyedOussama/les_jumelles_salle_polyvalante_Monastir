"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Loader2, XCircle, Eye, EyeOff } from "lucide-react";
import { verifyAdminPassword } from "../actions/auth";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await verifyAdminPassword(password);

      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error || "Mot de passe incorrect.");
        setIsLoading(false);
      }
    } catch {
      setError("Une erreur de communication est survenue.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5A880]/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C5A880]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image src="/logo.png" alt="Logo Les Jumelles" width={64} height={52} className="object-contain drop-shadow-sm" />
            <div className="text-left">
              <span className="text-xl font-serif font-bold tracking-[0.18em] uppercase block leading-none text-slate-900">
                Les Jumelles
              </span>
              <span className="text-[9px] uppercase tracking-[0.35em] text-[#C5A880] font-semibold block mt-1">
                Salle Polyvalente Monastir
              </span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-[0_25px_60px_rgba(197,168,128,0.12)] relative backdrop-blur-xl">
          
          {/* Top accent border */}
          <div className="absolute top-0 left-0 w-full h-[3.5px] bg-[#C5A880] rounded-t-3xl shadow-sm"></div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FCFAF7] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
              <Lock size={26} className="text-[#C5A880]" />
            </div>
            <h1 className="text-2xl font-serif text-slate-900 mb-2 tracking-wide font-bold">Espace Administration</h1>
            <p className="text-slate-500 text-xs font-light">Veuillez renseigner votre clé d&apos;accès pour administrer la salle.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">
                Clé d&apos;accès / Mot de passe
              </label>
              
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all duration-300 font-mono tracking-widest text-lg shadow-inner" 
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoFocus
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || !password}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C5A880] transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer p-1"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-rose-600 text-xs mt-3 flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg animate-in fade-in duration-300">
                  <XCircle size={15} className="shrink-0" /> 
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading || !password}
              className="w-full bg-[#C5A880] hover:bg-[#b2936a] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-md shadow-[#C5A880]/15 active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer text-xs uppercase tracking-widest"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" /> 
                  <span>Vérification...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to site link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-[#C5A880] text-xs font-semibold transition-colors"
          >
            ← Retour au site
          </Link>
        </div>

      </div>
    </div>
  );
}
