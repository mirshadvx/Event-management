import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getManagedUsers, toggleUserStatus, deleteManagedUser, createManagedUser } from "@/services/userManagement";
import { formatDate } from "@/utils/dateUtils";

const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.]{2,19}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*_\-.]{6,64}$/;

const UserManagementModal = ({ isOpen, onClose, eventId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [userPendingDelete, setUserPendingDelete] = useState(null);
  const isDeleteDialogOpen = Boolean(userPendingDelete);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const passwordValue = watch("password");

  const loadUsers = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const response = await getManagedUsers(eventId);
      setUsers(response || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!isOpen) return;

    loadUsers();
  }, [isOpen, loadUsers]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const onSubmit = async (data) => {
    try {
      setCreating(true);
      setErrorMessage("");
      setSuccessMessage("");
      const createdUser = await createManagedUser(eventId, {
        username: data.username.trim(),
        password: data.password,
      });
      setSuccessMessage(`User "${createdUser.username}" created successfully.`);
      reset();
      await loadUsers();
    } catch (error) {
      console.error(error);

      setErrorMessage(error.response?.data?.error || "Unable to create user.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setToggleLoadingId(user.id);
      await toggleUserStatus(eventId, user.id, !user.active);

      await loadUsers();
    } catch (error) {
      console.error(error);

      setErrorMessage("Unable to update user status.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  const requestDelete = (user) => {
    setUserPendingDelete(user);
  };

  const cancelDelete = () => {
    if (deleteLoadingId) return;
    setUserPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!userPendingDelete) return;
    const userId = userPendingDelete.id;

    try {
      setDeleteLoadingId(userId);
      await deleteManagedUser(eventId, userId);
      setSuccessMessage("User deleted successfully.");
      setUserPendingDelete(null);
      await loadUsers();
    } catch (error) {
      console.error(error);

      setErrorMessage("Unable to delete user.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const SkeletonLoader = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-gray-800 rounded-lg p-5">
        <Skeleton className="h-6 w-40 bg-gray-700 mb-5" />
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-12 bg-gray-700 mb-3" />
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg p-5">
        <Skeleton className="h-6 w-44 bg-gray-700 mb-5" />
        <Skeleton className="h-10 bg-gray-700 mb-4" />
        <Skeleton className="h-10 bg-gray-700 mb-4" />
        <Skeleton className="h-10 bg-gray-700" />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 text-white h-auto max-h-screen sm:max-h-[90vh] p-0 pt-5 w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl overflow-hidden">
          <DialogHeader className="px-6">
            <DialogTitle className="text-xl">Manage Users</DialogTitle>

            <DialogDescription>
              Create and manage ticket validation users.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-150px)] px-6 pb-6">
            {loading ? (
              <SkeletonLoader />
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 mt-2">
                <div className="lg:col-span-2 bg-gray-800 rounded-lg p-5 shadow">
                  <h3 className="text-xl font-semibold mb-5">Users</h3>

                  {users.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                      No managed users found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700 text-sm uppercase text-gray-400">
                            <th className="py-3 text-left">Username</th>
                            <th className="py-3 text-left">Permission Given</th>
                            <th className="py-3 text-left">Status</th>
                            <th className="py-3 text-right">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {users.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-[#34D399]/20 flex items-center justify-center text-[#34D399] font-semibold">
                                    {user.username?.charAt(0).toUpperCase()}
                                  </div>

                                  <span>{user.username}</span>
                                </div>
                              </td>

                              <td className="text-gray-400">
                                {formatDate(user.permission_given_date)}
                              </td>

                              <td>
                                <div className="flex items-center gap-3">
                                  <button
                                    disabled={toggleLoadingId === user.id}
                                    onClick={() => handleToggleStatus(user)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                                      user.active ? "bg-[#34D399]" : "bg-gray-600"
                                    }`}
                                  >
                                    {toggleLoadingId === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
                                    ) : (
                                      <span
                                        className={`inline-block h-4 w-4 rounded-full bg-white transform transition ${
                                          user.active
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                        }`}
                                      />
                                    )}
                                  </button>

                                  <span
                                    className={`text-sm ${
                                      user.active
                                        ? "text-green-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {user.active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </td>

                              <td className="text-right">
                                <button
                                  onClick={() => requestDelete(user)}
                                  disabled={deleteLoadingId === user.id}
                                  className="text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                  {deleteLoadingId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 rounded-lg p-5 shadow h-fit">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#34D399]" />
                    Create User
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 mb-5">
                    Assign a new scanner account.
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div>
                      <label className="text-sm mb-1 block">Username</label>

                      <input
                        type="text"
                        placeholder="scanner01"
                        autoComplete="off"
                        className={`w-full rounded-lg bg-gray-700 border px-3 py-2 outline-none focus:ring-2 ${
                          errors.username
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-600 focus:ring-[#34D399]"
                        }`}
                        {...register("username", {
                          required: "Username is required",
                          minLength: {
                            value: 3,
                            message: "Must be at least 3 characters",
                          },
                          maxLength: {
                            value: 20,
                            message: "Must be at most 20 characters",
                          },
                          pattern: {
                            value: USERNAME_PATTERN,
                            message:
                              "Must start with a letter and contain only letters, numbers, dots or underscores",
                          },
                          validate: (value) =>
                            value.trim() === value ||
                            "Username cannot start or end with a space",
                        })}
                      />

                      {errors.username && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm mb-1 block">Password</label>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          autoComplete="new-password"
                          className={`w-full rounded-lg bg-gray-700 border px-3 py-2 pr-10 outline-none focus:ring-2 ${
                            errors.password
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-600 focus:ring-[#34D399]"
                          }`}
                          {...register("password", {
                            required: "Password is required",
                            minLength: {
                              value: 6,
                              message: "Must be at least 6 characters",
                            },
                            maxLength: {
                              value: 64,
                              message: "Must be at most 64 characters",
                            },
                            pattern: {
                              value: PASSWORD_PATTERN,
                              message:
                                "Must include at least one letter and one number",
                            },
                            validate: (value) =>
                              !/\s/.test(value) || "Password cannot contain spaces",
                          })}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          tabIndex={-1} >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>

                      {errors.password ? (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.password.message}
                        </p>
                      ) : (
                        passwordValue && (
                          <p className="text-gray-500 text-xs mt-1">
                            Use 6+ characters with at least one letter and one number.
                          </p>
                        )
                      )}
                    </div>

                    {errorMessage && (
                      <div className="flex items-start gap-2 text-red-400 text-sm">
                        <X className="h-4 w-4 mt-0.5" />

                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-start gap-2 text-green-400 text-sm">
                        <Check className="h-4 w-4 mt-0.5" />

                        <span>{successMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full bg-[#34D399] text-gray-900 rounded-full py-2.5 font-semibold hover:bg-[#2fc48d] transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create User"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="bg-gray-900 text-white max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <DialogTitle className="text-lg">Delete user</DialogTitle>
            </div>

            <DialogDescription className="pt-2 text-gray-400">
              {userPendingDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <span className="text-white font-medium">
                    {userPendingDelete.username}
                  </span>
                  ? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <button
              type="button"
              onClick={cancelDelete}
              disabled={Boolean(deleteLoadingId)}
              className="px-4 py-2 rounded-full border border-gray-600 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDelete}
              disabled={Boolean(deleteLoadingId)}
              className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-60 inline-flex items-center gap-2 justify-center"
            >
              {deleteLoadingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagementModal;