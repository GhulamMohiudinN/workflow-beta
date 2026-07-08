import Link from "next/link";
import { FiCalendar, FiPlus } from "react-icons/fi";
import { Button } from "../../../components/Button";

export const DashboardActions = ({ role }) => {
  if (role === "viewer") return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
     
      <Link
        href="/processes"
        className="app-focus inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-hover)]"
      >
        <FiPlus size={16} />
        Create New
      </Link>
    </div>
  );
};
