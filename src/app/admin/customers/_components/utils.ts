
import type { Customer } from "@/lib/types";

export const getStatusColor = (status: Customer['status']) => {
    switch (status) {
        case 'Active':
            return '#22c55e'; // green-500
        case 'Lead':
            return '#3b82f6'; // blue-500
        case 'On Hold':
            return '#f97316'; // orange-500
        case 'Churned':
            return '#ef4444'; // red-500
        default:
            return '#64748b'; // slate-500
    }
}
