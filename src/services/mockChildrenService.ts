import type { Child } from './childrenService';

const mockChildren: Child[] = [
  {
    id: '1',
    parentId: 'parent-123',
    name: 'Alex',
    age: 4,
    gender: 'Male',
    dateOfBirth: '2020-01-01',
    notes: 'Friendly and active',
    createdAt: new Date().toISOString(),
  }
];

export const mockChildrenService = {
  getChildren: async (): Promise<Child[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockChildren];
  },

  getChild: async (id: string): Promise<Child> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const child = mockChildren.find(c => c.id === id);
    if (!child) throw new Error('Child not found');
    return child;
  },

  createChild: async (data: Omit<Child, 'id'>): Promise<Child> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newChild: Child = {
      ...data,
      id: String(mockChildren.length + 1),
    };
    mockChildren.push(newChild);
    return newChild;
  },

  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockChildren.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Child not found');
    mockChildren[index] = { ...mockChildren[index], ...data };
    return mockChildren[index];
  },

  deleteChild: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockChildren.findIndex(c => c.id === id);
    if (index !== -1) mockChildren.splice(index, 1);
  },
};
