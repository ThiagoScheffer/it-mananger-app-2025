
import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import { getUsers, saveUsers } from "@/utils/storageManager";

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        // First try to load from session storage (for current session)
        const userJson = sessionStorage.getItem("gestor-pro-current-user");
        
        if (userJson) {
          const loadedUser = JSON.parse(userJson);
          setUser(loadedUser);
          setIsAuthenticated(true);
          console.log("User loaded from session:", loadedUser.email);
        } else {
          console.log("No user in session");
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log(`Attempting login for: ${email}`);
      
      // Try to find the user in the new data structure
        // Get all users and find by email
        const users = getUsers();
        const foundUser = users.find(user => user.email === email);
      
      // If user not found or password doesn't match
      if (!foundUser) {
        console.log("User not found");
        setIsLoading(false);
        return false;
      }
      
      // Check password
      if (foundUser.password !== password) {
        console.log("Password mismatch");
        setIsLoading(false);
        return false;
      }
      
      // User authenticated successfully
      console.log("User authenticated successfully:", foundUser.name);
      
      // Update last login
      const updatedUser = {
        ...foundUser,
        lastLogin: new Date().toISOString()
      };

        // Update user in storage
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        saveUsers(updatedUsers);
      
      // Store in state and session
      setUser(updatedUser);
      setIsAuthenticated(true);
      sessionStorage.setItem("gestor-pro-current-user", JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("gestor-pro-current-user");
  }, []);

  const checkUserRole = useCallback(
    (allowedRoles: string[]): boolean => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkUserRole
  };
};
