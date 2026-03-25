import { Bell, User } from "lucide-react";

interface HeaderProps {
  title?: string;
  username?: string;
  displayName?: string | null;
}

export default function Header({
  title = "Dashboard",
  username,
  displayName,
}: HeaderProps) {
  const initials = (displayName ?? username ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#e7e2d3] shrink-0">
      <div>
        <h1 className="text-base font-semibold text-[#0a322d]">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Benachrichtigungen"
          className="relative p-2 text-[#737373] hover:text-[#0a322d] hover:bg-[#ebebf0] rounded-lg transition-colors duration-150"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-[#e7e2d3] ml-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1e7378] text-white text-xs font-semibold">
            {username ? initials : <User className="w-4 h-4" />}
          </div>
          {username && (
            <span className="text-sm font-medium text-[#0a322d] hidden sm:block">
              {displayName ?? username}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
