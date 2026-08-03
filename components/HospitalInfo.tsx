"use client";
import { useEffect, useState } from "react";

type Settings = {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    twitter: string;
    linkedin: string;
    facebook: string;
    instagram: string;
};

const FALLBACK: Settings = {
    name: "MEDCRUSH BLOCKCHAIN HOSPITAL",
    email: "medcrush@gmail.com",
    phone: "08023000000",
    address: "2, Hospital Road, Benin",
    website: "",
    twitter: "",
    linkedin: "",
    facebook: "",
    instagram: "",
};

export default function HospitalInfo() {
    const [settings, setSettings] = useState<Settings>(FALLBACK);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                setSettings(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching hospital info:", err);
                setLoading(false);
            });
    }, []);

    const name = settings?.name || FALLBACK.name;
    const address = settings?.address || FALLBACK.address;
    const phone = settings?.phone || FALLBACK.phone;
    const email = settings?.email || FALLBACK.email;

    return (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-200">{name}</p>
            <p>{address}</p>
            <p>📞 {phone}</p>
            <p>✉️ {email}</p>
            {loading && <p className="text-xs text-gray-400">Loading latest info...</p>}
        </div>
    );
}