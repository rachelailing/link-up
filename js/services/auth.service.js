// js/services/auth.service.js
import { storage } from "../utils/storage.js";

/**
 * Authentication Service
 * Responsibility: Handle all login, registration, and session management.
 */
export class AuthService {
  constructor() {
    this.STORAGE_KEYS = {
      STUDENT_PROFILE: "linkup_student_profile",
      EMPLOYER_PROFILE: "linkup_employer_profile",
      CURRENT_USER: "linkup_currentUser",
      REMEMBER_EMAIL: "linkup_remember_email"
    };
  }

  /**
   * Mock login for students/employers
   * @param {string} email 
   * @param {string} password 
   * @param {string} role - 'student' or 'employer'
   * @returns {Promise<Object>} User data on success
   * @throws {Error} On failure
   */
  async login(email, password, role) {
    // In a real app, this would be a fetch() call
    const storedProfile = this._getProfileByRole(role);
    
    if (!storedProfile || storedProfile.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("No account found for this email. Please register first.");
    }

    // Mock session creation
    const userSession = {
      ...storedProfile,
      role,
      loggedInAt: new Date().toISOString()
    };

    storage.set(this.STORAGE_KEYS.CURRENT_USER, userSession);
    return userSession;
  }

  /**
   * Registers a new user
   * @param {Object} userData 
   * @param {string} role - 'student' or 'employer'
   * @returns {Promise<Object>} The registered user
   */
  async register(userData, role) {
    const key = role === "student" 
      ? this.STORAGE_KEYS.STUDENT_PROFILE 
      : this.STORAGE_KEYS.EMPLOYER_PROFILE;
    
    storage.set(key, { ...userData, role });
    return userData;
  }

  logout() {
    storage.remove(this.STORAGE_KEYS.CURRENT_USER);
    window.location.href = "/index.html";
  }

  getCurrentUser() {
    return storage.get(this.STORAGE_KEYS.CURRENT_USER);
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }

  setRememberMe(email, enabled) {
    if (enabled) {
      storage.set(this.STORAGE_KEYS.REMEMBER_EMAIL, email);
    } else {
      storage.remove(this.STORAGE_KEYS.REMEMBER_EMAIL);
    }
  }

  getRememberedEmail() {
    return storage.get(this.STORAGE_KEYS.REMEMBER_EMAIL) || "";
  }

  _getProfileByRole(role) {
    const key = role === "student" 
      ? this.STORAGE_KEYS.STUDENT_PROFILE 
      : this.STORAGE_KEYS.EMPLOYER_PROFILE;
    return storage.get(key);
  }
}

// Singleton
export const authService = new AuthService();
