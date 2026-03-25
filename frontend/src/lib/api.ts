const BASE_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
  cgpa?: number;
  branch?: string;
  backlogs?: number;
}) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

export async function getProfile() {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
  return data;
}


export async function updateProfile(data: {
  name: string;
  cgpa?: number;
  branch?: string;
  backlogs?: number;
}) {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to update profile");
  return result;
}