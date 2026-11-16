/** Represents a user authentication payload */
export interface AuthCredentials {
  /** Email address used for login/registration */
  email: string;
  /** Plain‑text password (in a real app this would be hashed & salted) */
  password: string;
}

/** Simple user profile representation */
export interface User {
  /** Unique identifier */
  id: string;
  /** User's full name */
  name: string;
  /** Email address */
  email: string;
  /** Role-based access (e.g., 'admin', 'customer') */
  role: string;
}

/**
 * Authentication service – provides basic login / registration helpers.
 * In a production system this would talk to a database or external auth provider.
 */
export class AuthService {
  /**
   * Validates credentials and returns a user token.
   * @param creds - Email and password to verify.
   * @returns A promise that resolves to a user token string.
   */
  async login(creds: AuthCredentials): Promise<string> {
    // TODO: replace with real credential checking logic.
    // For demo purposes we accept any non‑empty email/password pair.
    if (!creds.email || !creds.password) {
      throw new Error('Email and password are required');
    }
    // Simulate a token that could be a JWT, session ID, etc.
    return `token_${Date.now()}_${creds.email}`;
  }

  /**
   * Registers a new user.
   * @param user - User data to create.
   * @returns The created user object.
   */
  async register(user: Omit<User, 'id'>): Promise<User> {
    // TODO: persist the user (e.g., DB insert) and assign a real ID.
    const generatedId = `user_${Date.now()}`;
    return { ...user, id: generatedId };
  }
}

/* Export a singleton instance for convenience */
export default new AuthService();