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
import { Settings } from "lucide-react";

export const AccountSettingsModal = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ")[1] || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  // Password form state
  const [emailForPassword, setEmailForPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Mask email (show only first 2 chars + *** + domain)
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) return email;
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  // Update profile (name + avatar)
  const handleUpdateProfile = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = user?.avatar;

      // Upload avatar if changed
      if (avatar) {
        const formData = new FormData();
        formData.append("avatar", avatar);
        const uploadRes = await API.post("/upload/avatar", formData);
        avatarUrl = uploadRes.data.url;
      }

      await API.put("/user/profile", {
        name: fullName,
        avatar: avatarUrl,
      });

      // Update local user state
      const { user: currentUser } = useAuth.getState();
      if (currentUser) {
        useAuth.setState({
          user: { ...currentUser, name: fullName, avatar: avatarUrl },
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

  // Verify email for password change
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

  // Change password
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
      await API.post("/auth/change-password", {
        email: emailForPassword,
        newPassword,
      });
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

  // Delete account
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Profile</h3>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarPreview || user?.avatar || ""} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="text-xs text-primary cursor-pointer hover:underline"
                >
                  Change Avatar
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email (masked) */}
            <div>
              <Label>Email</Label>
              <Input
                value={maskEmail(user?.email || "")}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Save Changes
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Change Password Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Change Password
            </h3>

            {!emailVerified ? (
              <>
                <div>
                  <Label>Verify Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter your account email"
                    value={emailForPassword}
                    onChange={(e) => setEmailForPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your email to verify identity
                  </p>
                </div>
                <Button
                  onClick={handleVerifyEmail}
                  variant="outline"
                  className="w-full"
                >
                  Verify Email
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Spinner className="w-4 h-4 mr-2" /> : null}
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
              </>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Delete Account Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-destructive">
              Delete Account
            </h3>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full"
              >
                Delete Account
              </Button>
            ) : (
              <>
                <div>
                  <Label>Type "DELETE" to confirm</Label>
                  <Input
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      "Confirm Delete"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
