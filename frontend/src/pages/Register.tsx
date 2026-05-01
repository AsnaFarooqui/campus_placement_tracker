import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, User, Mail, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { registerUser, loginUser, verifyEmail } from "@/lib/api.ts";
import type { UserRole } from "@/lib/auth-context";

export default function Register() {
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [backlogs, setBacklogs] = useState("0");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsedCgpa = cgpa ? parseFloat(cgpa) : NaN;
    const parsedBacklogs = backlogs ? parseInt(backlogs, 10) : 0;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (role === "student") {
      if (!branch) {
        setError("Branch is required for student accounts.");
        return;
      }
      if (!Number.isFinite(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 4) {
        setError("CGPA must be between 0.0 and 4.0.");
        return;
      }
      if (!Number.isInteger(parsedBacklogs) || parsedBacklogs < 0) {
        setError("Backlogs must be a non-negative whole number.");
        return;
      }
    }
    try {
      const registration = await registerUser({
        name,
        email,
        password,
        role,
        cgpa: role === "student" ? parsedCgpa : undefined,
        branch: branch || undefined,
        backlogs: role === "student" ? parsedBacklogs : undefined,
      });
      if (registration.verificationToken) {
        await verifyEmail(registration.verificationToken);
      }
      const data = await loginUser(email, password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">PlaceTrack</span>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-muted-foreground mb-6">Join the campus placement platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="John Doe" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="officer">Placement Officer</SelectItem>
                      <SelectItem value="admin">College Administration</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="you@university.edu" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {role === "student" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Branch</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology"].map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CGPA</Label>
                  <div className="relative mt-1.5">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="number" step="0.1" min="0" max="4" placeholder="3.5" className="pl-10" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Backlogs</Label>
                  <Input type="number" min="0" step="1" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-secondary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
