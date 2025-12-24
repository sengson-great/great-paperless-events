import { Search } from "lucide-react";
export default function Header() {
    return (
        <div className="mb-8 flex items-center">
          <h1 className="text-3xl font-bold text-blue-400! me-40">Admin Dashboard</h1>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search anything here..." 
              className="w-80 pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
    )
}