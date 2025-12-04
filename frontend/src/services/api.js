import { AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react";

// Use localhost for local dev
const API_BASE_URL = "http://127.0.0.1:5000/api";

export const fetchStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { total_projects: 0, total_budget: 0, flagged_projects: 0, flagged_percentage: 0 };
  }
};

export const fetchProjects = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export const getRiskConfig = (riskLevel) => {
  switch (riskLevel?.toUpperCase()) {
    case "CRITICAL":
      return { color: "#ef4444", bg: "bg-red-500", border: "border-red-500", icon: AlertTriangle };
    case "HIGH":
      return { color: "#eab308", bg: "bg-yellow-500", border: "border-yellow-500", icon: Clock };
    default:
      return { color: "#10b981", bg: "bg-emerald-500", border: "border-emerald-500", icon: CheckCircle };
  }
};