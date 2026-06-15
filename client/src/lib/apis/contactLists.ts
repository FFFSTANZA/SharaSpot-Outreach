import api from "../axios";

export interface ContactList {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { contacts: number };
}

export const getContactLists = async (): Promise<ContactList[]> => {
  const res = await api.get("/api/contact-lists");
  return res.data;
};

export const createContactList = async (name: string): Promise<ContactList> => {
  const res = await api.post("/api/contact-lists", { name });
  return res.data;
};

export const updateContactList = async (id: string, name: string): Promise<ContactList> => {
  const res = await api.put(`/api/contact-lists/${id}`, { name });
  return res.data;
};

export const deleteContactList = async (id: string): Promise<void> => {
  await api.delete(`/api/contact-lists/${id}`);
};

export const addContactsToList = async (listId: string, contactIds: string[]): Promise<ContactList> => {
  const res = await api.post(`/api/contact-lists/${listId}/contacts`, { contactIds });
  return res.data;
};

export const removeContactsFromList = async (listId: string, contactIds: string[]): Promise<ContactList> => {
  const res = await api.delete(`/api/contact-lists/${listId}/contacts`, { data: { contactIds } });
  return res.data;
};
