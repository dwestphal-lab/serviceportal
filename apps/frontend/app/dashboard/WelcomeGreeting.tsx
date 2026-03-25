"use client";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

export function WelcomeGreeting({ displayName }: { displayName?: string }) {
  const greeting = getGreeting();
  return (
    <h2 className="text-2xl font-bold text-[#0a322d]">
      {greeting}{displayName ? `, ${displayName}` : ""}
    </h2>
  );
}
