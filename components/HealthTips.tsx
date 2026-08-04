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

export default function HealthTips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [filteredTips, setFilteredTips] = useState<Tip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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
    if (selectedCategory === "All") {
      setFilteredTips(tips);
    } else {
      setFilteredTips(tips.filter((tip) => tip.category === selectedCategory));
    }
  }, [selectedCategory, tips]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const tipOfDay = tips.length > 0 ? tips[new Date().getDate() % tips.length] : null;

  return (
    <div className="animate-fade-in">
      {tipOfDay && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-l-4 border-primary-500 p-4 mb-6 rounded-xl shadow-card">
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">🌟 Tip of the Day</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{tipOfDay.title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{tipOfDay.content}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{tipOfDay.category}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm transition-all ${
              selectedCategory === cat
                ? "bg-primary-600 text-white shadow-md dark:bg-primary-500"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTips.slice(0, 6).map((tip) => (
          <div key={tip.id} className="card card-hover">
            <h3 className="font-semibold text-lg text-primary-700 dark:text-primary-300">{tip.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{tip.content}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {tip.category} • {new Date(tip.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {filteredTips.length > 6 && (
        <div className="text-center mt-4">
          <Link href="/tips" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">
            View all {filteredTips.length} tips →
          </Link>
        </div>
      )}
    </div>
  );
}
