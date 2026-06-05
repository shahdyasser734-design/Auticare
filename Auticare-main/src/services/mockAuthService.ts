import type { User, UserRole } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupResponse {
  token: string;
  user: User;
}

// Mock user database
const mockUsers: Record<string, User & { password: string }> = {
  'parent@example.com': {
    id: '1',
    email: 'parent@example.com',
    name: 'John Parent',
    role: 'parent',
    phone: '1234567890',
    createdAt: new Date().toISOString(),
    password: 'password123',
  },
  'doctor@example.com': {
    id: '2',
    email: 'doctor@example.com',
    name: 'Dr. Smith',
    role: 'doctor',
    phone: '0987654321',
    createdAt: new Date().toISOString(),
    password: 'password123',
  },
};

export const mockAuthService = {
  login: async (email: string, loginPassword: string): Promise<LoginResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers[email];
    if (!user || user.password !== loginPassword) {
      throw new Error('Invalid email or password');
    }

    const { password: storedPassword, ...userWithoutPassword } = user;
    void storedPassword;
    const token = btoa(`${email}:${Date.now()}`);

    return {
      token,
      user: userWithoutPassword as User,
    };
  },

  signup: async (payload: Record<string, unknown>): Promise<SignupResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const email = payload.email as string;
    const signupPassword = payload.password as string;
    const fullName = payload.fullName as string;
    const role = (payload.role as string)?.toLowerCase() === 'specialist'
      ? 'doctor'
      : (payload.role as string)?.toLowerCase() || 'parent';

    if (!email || !signupPassword || !fullName) {
      throw new Error('Email, password, and name are required');
    }

    if (mockUsers[email]) {
      throw new Error('Email already registered');
    }

    const newUser: User & { password: string } = {
      id: String(Object.keys(mockUsers).length + 1),
      email,
      name: fullName,
      role: role as UserRole,
      phone: payload.phone as string,
      createdAt: new Date().toISOString(),
      password: signupPassword,
    };

    mockUsers[email] = newUser;

    const { password, ...userWithoutPassword } = newUser;
    void password;
    const token = btoa(`${email}:${Date.now()}`);

    return {
      token,
      user: userWithoutPassword as User,
    };
  },

  forgotPassword: async (_email: string): Promise<void> => {
    void _email;
    await new Promise((resolve) => setTimeout(resolve, 300));
  },

  resetPassword: async (_token: string, _password: string): Promise<void> => {
    void _token;
    void _password;
    await new Promise((resolve) => setTimeout(resolve, 300));
  },

  logout: async (): Promise<void> => {
    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 100));
  },

  verifyEmail: async (_code: string): Promise<void> => {
    void _code;
    await new Promise((resolve) => setTimeout(resolve, 300));
  },

  getCurrentUser: async (): Promise<User> => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }
    throw new Error('Not authenticated');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      throw new Error('Not authenticated');
    }
    const user = JSON.parse(storedUser) as User;
    const updatedUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },
};
