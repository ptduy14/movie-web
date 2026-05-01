import { FaCrown } from 'react-icons/fa';

interface ExclusiveBadgeProps {
  show?: boolean;
}

/**
 * "Độc quyền" gold badge — shown when `sub_docquyen: true`.
 */
export default function ExclusiveBadge({ show = true }: ExclusiveBadgeProps) {
  if (!show) return null;

  return (
    <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow">
      <FaCrown className="text-[10px]" />
      Độc quyền
    </span>
  );
}
