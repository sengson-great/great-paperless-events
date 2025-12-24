import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
    return (
      <div className="flex items-center justify-center space-x-2 py-4 border-t">
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1 bg-blue-500 text-white rounded">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button>
              <span className="px-2">...</span>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">99</button>
              <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
        </div>
)}