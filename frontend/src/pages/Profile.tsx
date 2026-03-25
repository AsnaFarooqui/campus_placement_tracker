import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, BookOpen, GraduationCap, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

export default function Profile() {
  const { user, isAuthenticated, login, token } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [backlogs, setBacklogs] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user) {
      setName(user.name || "");
      setBranch(user.branch || "");
      setCgpa(user.cgpa?.toString() || "");
      setBacklogs(user.backlogs?.toString() || "0");
    }
  }, [user, isAuthenticated]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    try {
      const updated = await updateProfile({
        name,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        branch: branch || undefined,
        backlogs: backlogs ? parseInt(backlogs) : 0,
      });
      login(token!, updated);
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || "");
      setBranch(user.branch || "");
      setCgpa(user.cgpa?.toString() || "");
      setBacklogs(user.backlogs?.toString() || "0");
    }
    setEditing(false);
    setError("");
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold">My Profile</h1>
              <p className="text-muted-foreground text-sm mt-1">View and update your details</p>
            </div>
            {!editing && (
              <Button variant="outline" onClick={() => setEditing(true)} className="flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Edit Profile
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">

            {/* Avatar + role badge */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-lg">{user.name}</p>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            <hr className="border-border" />

            {/* Fields */}
            <div className="space-y-4">

              {/* Name */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4" /> Full Name
                </Label>
                {editing ? (
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                ) : (
                  <p className="text-sm text-muted-foreground pl-1">{user.name || "—"}</p>
                )}
              </div>

              {/* Email (not editable) */}
              <div>
                <Label className="flex items-center gap-2 mb-1.5">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <p className="text-sm text-muted-foreground pl-1">{user.email}</p>
              </div>

              {/* Student-only fields */}
              {user.role === "student" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-1.5">
                        <GraduationCap className="w-4 h-4" /> Branch
                      </Label>
                      {editing ? (
                        <Select value={branch} onValueChange={setBranch}>
                          <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                          <SelectContent>
                            {["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology"].map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground pl-1">{user.branch || "—"}</p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 mb-1.5">
                        <BookOpen className="w-4 h-4" /> CGPA
                      </Label>
                      {editing ? (
                        <Input type="number" step="0.1" min="0" max="4" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
                      ) : (
                        <p className="text-sm text-muted-foreground pl-1">{user.cgpa ?? "—"}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Backlogs</Label>
                    {editing ? (
                      <Input type="number" min="0" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} />
                    ) : (
                      <p className="text-sm text-muted-foreground pl-1">{user.backlogs ?? 0}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Error / Success messages */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}

            {/* Edit action buttons */}
            {editing && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}