"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Tip = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
};

const CATEGORIES = [
  "All",
  "Daily Routine",
  "Nutrition",
  "Mental Health",
  "Fitness",
  "Preventive Care",
  "Sleep",
  "Hydration",
  "General Wellness",
];

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [filteredTips, setFilteredTips] = useState<Tip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tips")
      .then((res) => res.json())
      .then((data) => {
        setTips(data);
        setFilteredTips(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = tips;
    if (selectedCategory !== "All") {
      result = result.filter((tip) => tip.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (tip) =>
          tip.title.toLowerCase().includes(term) ||
          tip.content.toLowerCase().includes(term)
      );
    }
    setFilteredTips(result);
  }, [selectedCategory, searchTerm, tips]);

  if (loading) {
    return <div className="min-h-screen py-8 px-4">Loading tips...</div>;
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">💡 All Health Tips</h1>
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline text-sm sm:text-base">
            ← Back to Home
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tips by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                selectedCategory === cat
                  ? "bg-primary-600 text-white shadow-md dark:bg-primary-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Showing {filteredTips.length} tips
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTips.map((tip) => (
            <div key={tip.id} className="card card-hover p-4 sm:p-6">
              <h3 className="font-semibold text-base sm:text-lg text-primary-700 dark:text-primary-300">{tip.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{tip.content}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {tip.category} • {new Date(tip.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}