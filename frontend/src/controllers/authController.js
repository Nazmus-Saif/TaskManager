import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../services/axiosRequests.js";

export const authController = create((set, get) => ({
  authorizedUser: null,
  isSigningUp: false,
  isVerifyingEmail: false,
  isSigningIn: false,
  roles: [],
  isCreatingRole: false,
  isFetchingRoles: false,
  isUpdatingProfile: false,
  isCheckingAuthentication: true,
  isSendingForgotPasswordEmail: false,
  isPasswordReset: false,
  users: [],
  isUserFetching: false,
  isUserUpdating: false,
  isUserDeleting: false,
  isTaskAdded: false,
  tasks: [],
  isTaskFetching: false,
  userTasks: [],
  isGettingUserTask: false,
  isTaskUpdating: false,
  isTaskDeleting: false,
  counts: null,
  isGettingCounts: false,
  statusCounts: null,
  isGettingStatusCounts: false,
  upcomingDeadlines: null,
  isGettingUpcomingDeadlines: false,
  userTasksCounts: null,
  isGettingUserTasksCounts: false,
  isSendingAlert: false,
  notifications: [],
  isGettingNotifications: false,
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuthentication: true });
    try {
      const res = await axiosInstance.get("token/check-auth-user/");
      set({ authorizedUser: res.data });
    } catch (error) {
      if (error.response?.status === 401) {
        await get().refreshToken();
      }
    } finally {
      set({ isCheckingAuthentication: false });
    }
  },

  refreshToken: async () => {
    try {
      await axiosInstance.post("token/refresh-token/");
    } catch (error) {
      // toast.error(error.response?.data?.error);
    }
  },

  signUp: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("users/create-retrieve/", data);
      if (res.data) {
        toast.success("User created successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isSigningUp: false });
    }
  },

  signIn: async (data) => {
    set({ isSigningIn: true });
    try {
      const res = await axiosInstance.post("users/sign-in/", data);
      if (res.data) {
        set({ authorizedUser: res.data });
        toast.success("Signed in successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isSigningIn: false });
    }
  },

  googleSignIn: async (credential) => {
    set({ isSigningIn: true });
    try {
      const res = await axiosInstance.post("users/google-signin/", {
        credential: credential,
      });
      if (res.data) {
        set({ authorizedUser: res.data });
        toast.success("Signed in successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isSigningIn: false });
    }
  },

  signOut: async () => {
    try {
      await axiosInstance.post("users/sign-out/");
      set({ authorizedUser: null });
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error);
    }
  },

  createRole: async (data) => {
    set({ isCreatingRole: true });
    try {
      const res = await axiosInstance.post("roles/create/", data);
      if (res.data) {
        toast.success("Role created successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isCreatingRole: false });
    }
  },

  getRoles: async () => {
    set({ isFetchingRoles: true });
    try {
      const res = await axiosInstance.get("roles/retrieve/");
      if (res.data) {
        set({ roles: res.data });
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isFetchingRoles: false });
    }
  },

  getUsers: async () => {
    set({ isUserFetching: true });
    try {
      const res = await axiosInstance.get("users/create-retrieve/");
      if (res.data) {
        set({ users: res.data.users });
      }
    } catch (error) {
    } finally {
      set({ isUserFetching: false });
    }
  },

  updateUser: async (userId, data) => {
    set({ isUserUpdating: true });
    try {
      const res = await axiosInstance.put(
        `users/update-delete/${userId}/`,
        data
      );
      if (res.data) {
        toast.success("User updated successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isUserUpdating: false });
    }
  },

  deleteUser: async (userId) => {
    set({ isUserDeleting: true });
    try {
      const res = await axiosInstance.delete(`users/update-delete/${userId}/`);
      if (res.data) {
        toast.success("User deleted successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isUserDeleting: false });
    }
  },

  verifyEmail: async (verificationToken) => {
    set({ isVerifyingEmail: true });
    try {
      const res = await axiosInstance.post("/auth/verify-email", {
        verificationToken,
      });
      if (res.data) {
        set({ authorizedUser: res.data });
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isVerifyingEmail: false });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/update-profile/", data);
      if (res.data) {
        set({ authorizedUser: res.data });
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isSendingForgotPasswordEmail: true });
    try {
      const res = await axiosInstance.post("users/forgot-password/", { email });
      if (res.data) {
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isSendingForgotPasswordEmail: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isPasswordReset: true });
    try {
      const res = await axiosInstance.post(`users/reset-password/${token}/`, {
        password,
      });
      if (res.data) {
        toast.success(res.data.message + " redirecting to login page");
      }
    } catch (error) {
      toast.error(error.response.data.message + " redirecting to login page");
    } finally {
      set({ isPasswordReset: false });
    }
  },

  addTask: async (data) => {
    set({ isTaskAdded: true });
    try {
      const res = await axiosInstance.post("/add-task/", data);
      if (res.data) {
        toast.success("Task added successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isTaskAdded: false });
    }
  },

  getTasks: async () => {
    set({ isTaskFetching: true });
    try {
      const res = await axiosInstance.get("/get-tasks/");
      if (res.data) {
        set({ tasks: res.data.tasks });
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isTaskFetching: false });
    }
  },

  getUserTasks: async (userId) => {
    set({ isGettingUserTask: true });
    try {
      const res = await axiosInstance.get(`/get-user-tasks/${userId}/`);
      if (res.data) {
        set({ userTasks: res.data.userTasks });
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isGettingUserTask: false });
    }
  },

  sendAlert: async (userId, data) => {
    set({ isSendingAlert: true });
    try {
      const res = await axiosInstance.post(`users/send-alert/${userId}/`, data);
      if (res.data) {
        toast.success("Alert sent successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isSendingAlert: false });
    }
  },

  getNotifications: async (userId) => {
    set({ isGettingNotifications: true });
    try {
      const res = await axiosInstance.get(`users/get-notifications/${userId}/`);
      if (res.data) {
        set({ notifications: res.data.notifications });
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isGettingNotifications: false });
    }
  },

  updateTask: async (taskId, data) => {
    set({ isTaskUpdating: true });
    try {
      const res = await axiosInstance.put(`/edit-task/${taskId}/`, data);
      if (res.data) {
        toast.success("Task updated successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isTaskUpdating: false });
    }
  },

  deleteTask: async (taskId) => {
    set({ isTaskDeleting: true });
    try {
      const res = await axiosInstance.delete(`/delete-task/${taskId}/`);
      if (res.data) {
        toast.success("Task deleted successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      set({ isTaskDeleting: false });
    }
  },

  getCounts: async () => {
    set({ isGettingCounts: true });
    try {
      const res = await axiosInstance.get(`/get-counts/`);
      if (res.data) {
        set({ counts: res.data.counts });
      }
    } catch (error) {
    } finally {
      set({ isGettingCounts: false });
    }
  },

  getStatusCounts: async () => {
    set({ isGettingStatusCounts: true });
    try {
      const res = await axiosInstance.get("/get-status-counts/");
      if (res.data) {
        set({ statusCounts: res.data.statusCounts });
      }
    } catch (error) {
    } finally {
      set({ isGettingStatusCounts: false });
    }
  },

  getUpcomingDeadlines: async () => {
    set({ isGettingUpcomingDeadlines: true });
    try {
      const res = await axiosInstance.get("/get-upcoming-deadlines/");
      if (res.data) {
        set({ upcomingDeadlines: res.data.upcomingDeadlines });
      }
    } catch (error) {
    } finally {
      set({ isGettingUpcomingDeadlines: false });
    }
  },

  getUserTasksCounts: async (userId) => {
    set({ isGettingUserTasksCounts: true });
    try {
      const res = await axiosInstance.get(`/get-user-tasks-counts/${userId}/`);
      if (res.data) {
        set({ userTasksCounts: res.data.userTasksCounts });
      }
    } catch (error) {
    } finally {
      set({ isGettingUserTasksCounts: false });
    }
  },
}));
