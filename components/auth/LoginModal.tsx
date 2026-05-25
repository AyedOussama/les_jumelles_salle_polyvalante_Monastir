"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, XCircle, X, Eye, EyeOff } from "lucide-react";
import { verifyAdminPassword } from "../../app/actions/auth";

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
        setPassword("");
        setShowPassword(false);
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

  const closeModal = () => {
    setIsOpen(false);
    setPassword("");
    setShowPassword(false);
    setError("");
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-slate-400 hover:text-[#C5A880] transition-all duration-300 group cursor-pointer text-xs font-semibold uppercase tracking-wider"
      >
        <Lock size={12} className="group-hover:rotate-12 transition-transform duration-300 text-[#C5A880]" /> 
        Accès Gérant
      </button>

      {/* BACKDROP AND MODAL CONTAINER */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 transition-all duration-500 animate-in fade-in duration-300">
          
          {/* Main Dialog Box */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-12 w-full max-w-md shadow-[0_25px_60px_rgba(197,168,128,0.18)] relative animate-in fade-in zoom-in-95 duration-300 backdrop-blur-xl">
            
            {/* Top Close Button */}
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all duration-300 cursor-pointer p-1 rounded-full hover:bg-slate-50"
            >
              <X size={20} />
            </button>

            {/* Glowing Golden Top Accent Border */}
            <div className="absolute top-0 left-0 w-full h-[3.5px] bg-[#C5A880] rounded-t-3xl shadow-sm"></div>
            
            {/* Modal Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#FCFAF7] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm relative group">
                <Lock size={26} className="text-[#C5A880] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h2 className="text-2xl font-serif text-slate-900 mb-2 tracking-wide font-bold">Espace Gérant</h2>
              <p className="text-slate-500 text-xs font-light">Veuillez renseigner votre clé d&apos;accès pour administrer la salle.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">
                  Clé d&apos;accès / Mot de passe
                </label>
                
                {/* Input Container for Mask/Unmask */}
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
                  
                  {/* Eye Toggle button */}
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
                  <p className="text-rose-600 text-xs mt-3 flex items-center gap-1.5 animate-bounce bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
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
        </div>
      )}
    </>
  );
}
