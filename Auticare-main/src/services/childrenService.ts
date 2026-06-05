import apiClient from './apiClient';

export interface Child {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender: string;
  dateOfBirth?: string;
  familyAutismHistory?: boolean;
  jaundiceHistory?: boolean;
  medicalHistory?: string;
  notes?: string;
}

const normalizeChild = (raw: Record<string, unknown>): Child => {
  const firstName = String(raw.firstName ?? raw.first_name ?? '');
  const lastName = String(raw.lastName ?? raw.last_name ?? '');
  const name = String(raw.name ?? `${firstName} ${lastName}`.trim() ?? '');
  const childId = raw.childId ?? raw.child_id ?? raw.id ?? '';

  return {
    id: String(childId),
    name,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    age: raw.age ? Number(raw.age) : undefined,
    gender: String(raw.gender ?? raw.sex ?? ''),
    dateOfBirth: String(raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob ?? ''),
    familyAutismHistory: raw.familyAutismHistory ?? raw.family_autism_history ? Boolean(raw.familyAutismHistory ?? raw.family_autism_history) : undefined,
    jaundiceHistory: raw.jaundiceHistory ?? raw.jaundice_history ? Boolean(raw.jaundiceHistory ?? raw.jaundice_history) : undefined,
    medicalHistory: raw.medicalHistory ?? raw.medical_history ? String(raw.medicalHistory ?? raw.medical_history) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
  };
};

export const childrenService = {
  getChildren: async (): Promise<Child[]> => {
    const response = await apiClient.get<Child[]>('/children');
    const rawData = response.data as unknown as Record<string, unknown>[];
    return rawData.map(normalizeChild);
  },

  getChild: async (id: string): Promise<Child> => {
    const response = await apiClient.get<Record<string, unknown>>(`/children/${id}`);
    return normalizeChild(response.data as Record<string, unknown>);
  },

  createChild: async (data: Omit<Child, 'id'>): Promise<Child> => {
    const payload = {
      Name: data.name,
      FirstName: data.firstName,
      LastName: data.lastName,
      DateOfBirth: data.dateOfBirth,
      Gender: data.gender,
      FamilyAutismHistory: data.familyAutismHistory,
      JaundiceHistory: data.jaundiceHistory,
      MedicalHistory: data.medicalHistory,
      Notes: data.notes,
    };
    const response = await apiClient.post<Record<string, unknown>>('/children', payload);
    return normalizeChild(response.data as Record<string, unknown>);
  },

  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.put<Record<string, unknown>>(`/children/${id}`, data);
    return normalizeChild(response.data as Record<string, unknown>);
  },

  deleteChild: async (id: string): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
};
