import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Spinner } from "./ui/spinner";
import { toast } from "sonner";
import { API } from "@/lib/axios-client";
import { Settings, User, Key, Trash2, Upload } from "lucide-react";

export const AccountSettingsModal = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ")[1] || "");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  // Password form state
  const [emailForPassword, setEmailForPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Mask email
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) return email;
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      setAvatarBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      const payload: { name: string; avatar?: string } = { name: fullName };
      if (avatarBase64) {
        payload.avatar = avatarBase64;
      }

      const response = await API.put("/user/profile", payload);

      const { user: currentUser } = useAuth.getState();
      if (currentUser) {
        useAuth.setState({
          user: {
            ...currentUser,
            name: fullName,
            avatar: response.data.user.avatar,
          },
        });
      }

      toast.success("Profile updated successfully");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = () => {
    if (!emailForPassword) {
      toast.error("Please enter your email");
      return;
    }
    if (emailForPassword !== user?.email) {
      toast.error("Email does not match your account email");
      return;
    }
    setEmailVerified(true);
    toast.success("Email verified! You can now change your password.");
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await API.post("/auth/change-password", { newPassword });
      toast.success("Password changed successfully! Please login again.");
      logout();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to change password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await API.delete("/user/account");
      toast.success("Account deleted successfully");
      logout();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl">
        {/* Fixed Header */}
        <DialogHeader className="sticky top-0 z-10 p-5 pb-3 border-b bg-popover rounded-t-2xl">
          <DialogTitle className="text-lg font-semibold text-center">
            Account Settings
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content with minimal scrollbar */}
        <div className="max-h-[70vh] overflow-y-auto custom-scroll">
          <div className="p-5 space-y-6">
            {/* Profile Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Profile Information
                </h3>
              </div>

              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                    <AvatarImage src={avatarPreview || user?.avatar || ""} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Upload className="w-3 h-3" />
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    First Name
                  </Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  value={maskEmail(user?.email || "")}
                  disabled
                  className="bg-muted/50 h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="w-full h-9 text-sm mt-2"
              >
                {isLoading ? <Spinner className="w-3.5 h-3.5 mr-2" /> : null}
                Save Changes
              </Button>
            </div>

            <div className="border-t" />

            {/* Change Password Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Change Password
                </h3>
              </div>

              {!emailVerified ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Verify Email
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your account email"
                      value={emailForPassword}
                      onChange={(e) => setEmailForPassword(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your email to verify identity
                    </p>
                  </div>
                  <Button
                    onClick={handleVerifyEmail}
                    variant="outline"
                    className="w-full h-9 text-sm"
                  >
                    Verify Email
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      New Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Confirm Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="w-full h-9 text-sm"
                  >
                    {isLoading ? (
                      <Spinner className="w-3.5 h-3.5 mr-2" />
                    ) : null}
                    Update Password
                  </Button>
                  <button
                    onClick={() => {
                      setEmailVerified(false);
                      setEmailForPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs text-muted-foreground hover:text-primary text-center w-full"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Delete Account Section */}
            <div className="space-y-3">
              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  className="w-full h-9 text-sm"
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Type <span className="font-mono font-bold">DELETE</span>{" "}
                      to confirm
                    </Label>
                    <Input
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="flex-1 h-9 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      variant="destructive"
                      className="flex-1 h-9 text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Spinner className="w-3.5 h-3.5" />
                      ) : (
                        "Confirm Delete"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
