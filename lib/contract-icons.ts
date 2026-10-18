import type { ContractSection } from "@/lib/contracts";

// Shared outline artwork for the HTML preview and the vector PDF headings.
export const CONTRACT_ICON_PATHS: Record<ContractSection["icon"], string[]> = {
  calendar: ["M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z", "M7 14h2m3 0h2m3 0h1M7 17h2m3 0h2"],
  wallet: ["M20 8V5H5a2 2 0 0 1 0-4h13v4M4 5v15h18V8H5a2 2 0 0 1-1-3Z", "M17 12h5v5h-5a2 2 0 0 1 0-5Z"],
  shield: ["m12 2 9 4v6c0 5-5 9-9 11C8 21 3 17 3 12V6l9-4Z", "m8 12 3 3 5-6"],
  cancel: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "m8 8 8 8m0-8-8 8"],
  handshake: ["m2 9 4-6 5 2h4l3-2 4 6-4 3-5 8-3-1-3-1-3-5-2-1Z", "m11 5-4 5 2 2 4-3 5 3m-9 1 5 5m-7-2 4 4"],
  clock: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "M12 5v7l5 3"],
  clipboard: ["M8 4H4v18h16V4h-4M8 2h8v5H8V2Z", "M8 12h8m-8 4h8"],
  scales: ["M12 2v20m-6 0h12M3 6h18M6 6 2 15h8L6 6Zm12 0-4 9h8l-4-9Z"],
};
