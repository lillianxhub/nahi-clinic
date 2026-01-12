import { Eye, Pencil, Trash2 } from "lucide-react";

interface TableActionsProps {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function TableActions({
    onView,
    onEdit,
    onDelete,
}: TableActionsProps) {
    return (
        <div className="flex items-center justify-end gap-2">
            {onView && (
                <button
                    onClick={onView}
                    className="p-2 rounded-lg hover:bg-primary/10 text-primary"
                    aria-label="View"
                >
                    <Eye size={16} />
                </button>
            )}

            {onEdit && (
                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-600"
                    aria-label="Edit"
                >
                    <Pencil size={16} />
                </button>
            )}

            {onDelete && (
                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-600"
                    aria-label="Delete"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
}