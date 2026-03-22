// js/services/auth.service.js
import { supabase } from '../config/supabase.js';
import { storage } from '../utils/storage.js';

/**
 * Authentication Service
 * Responsibility: Handle all login, registration, and session management using Supabase.
 */
export class AuthService {
  constructor() {
    this.STORAGE_KEYS = {
      REMEMBER_EMAIL: 'linkup_remember_email',
    };
  }

  /**
   * Login for students/employers using Supabase Auth
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} User data on success
   * @throws {Error} On failure
   */
  async login(email, password) {
    console.log(`[AuthService] Attempting login for: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`[AuthService] Login failed for ${email}:`, error.message);
      throw error;
    }

    console.log(`[AuthService] Login successful! User ID: ${data.user?.id}`);
    return data.user;
  }

  /**
   * Registers a new user with role and profile metadata
   * @param {Object} userData - { email, password, fullName, university, etc. }
   * @param {string} role - 'student' or 'employer'
   * @returns {Promise<Object>} The registered user
   */
  async register(userData, role) {
    const { email, password, ...metadata } = userData;

    // Remove any potentially undefined or null values from metadata
    const cleanMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([_, v]) => v != null)
    );

    console.log(`[AuthService] Registering ${role}:`, { email, cleanMetadata });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          ...cleanMetadata,
          onboardingDone: false,
        },
      },
    });

    if (error) {
      console.error('[AuthService] Supabase signUp error:', error);
      throw error;
    }

    console.log('[AuthService] Registration successful for:', data.user?.email);
    return data.user;
  }

  /**
   * Update the current user's metadata
   * @param {Object} metadata
   */
  async updateUserMetadata(metadata) {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (error) throw error;
    return data.user;
  }

  /**
   * Signs out the current user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
    window.location.href = '/index.html';
  }

  /**
   * Gets the currently logged-in user session
   */
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  }

  /**
   * Guard for protected pages: redirect if not logged in
   * @param {string} requiredRole - 'student' or 'employer'
   * @returns {Promise<Object>} The authenticated user
   */
  async requireAuth(requiredRole = null) {
    const user = await this.getCurrentUser();

    if (!user) {
      console.warn('[AuthService] No session found, redirecting to login.');
      const loginPage =
        requiredRole === 'employer'
          ? '/pages/auth/employer-login.html'
          : '/pages/auth/student-login.html';
      window.location.href = loginPage;
      return null;
    }

    if (requiredRole && user.user_metadata?.role !== requiredRole) {
      console.warn(
        `[AuthService] Role mismatch: required ${requiredRole}, got ${user.user_metadata?.role}`
      );
      const homePage =
        user.user_metadata?.role === 'employer'
          ? '/pages/employer/employer_homepage.html'
          : '/pages/student/job-section.html';
      window.location.href = homePage;
      return null;
    }

    return user;
  }

  /**
   * Check if a user is currently logged in
   */
  async isLoggedIn() {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Helper to set "Remember Me" email in local storage
   */
  setRememberMe(email, enabled) {
    if (enabled) {
      storage.set(this.STORAGE_KEYS.REMEMBER_EMAIL, email);
    } else {
      storage.remove(this.STORAGE_KEYS.REMEMBER_EMAIL);
    }
  }

  /**
   * Helper to get remembered email
   */
  getRememberedEmail() {
    return storage.get(this.STORAGE_KEYS.REMEMBER_EMAIL) || '';
  }
}

// Singleton
export const authService = new AuthService();
