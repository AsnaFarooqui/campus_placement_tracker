import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { loginUser } from "@/lib/api.ts";
import type { UserRole } from "@/lib/mock-data";

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "student", label: "Student", desc: "Apply for placements" },
  { value: "recruiter", label: "Recruiter", desc: "Post jobs & hire" },
  { value: "officer", label: "Placement Officer", desc: "Manage drives" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const { login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  try {
    const data = await loginUser(email, password);
    login(data.token, data.user);
    navigate("/dashboard");
  } catch (err: any) {
    setError(err.message);
  }
};

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-primary-foreground/20"
              style={{ width: `${200 + i * 150}px`, height: `${200 + i * 150}px`, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10 text-primary-foreground max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-secondary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">PlaceTrack</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Your Campus Placement Journey, Simplified.
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Track applications, schedule interviews, and land your dream job — all from one platform.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[{ n: "450+", l: "Students" }, { n: "42", l: "Companies" }, { n: "87%", l: "Placed" }].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-display font-bold text-secondary">{s.n}</div>
                <div className="text-sm text-primary-foreground/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">PlaceTrack</span>
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to continue to your dashboard</p>

          {/* Role selector */}
          <div className="flex gap-2 mb-6">
            {roles.map((r) => (
              <button key={r.value} onClick={() => setSelectedRole(r.value)}
                className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all border ${
                  selectedRole === r.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10" />
              </div>
            </div>
            {error && (
  <p className="text-red-500 text-sm text-center">{error}</p>
)}
            <Button type="submit" className="w-full h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-secondary font-semibold hover:underline">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
