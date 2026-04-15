"use client";

import { Contact } from "@/types";
import { ContactRow } from "./ContactRow";
import { Users } from "lucide-react";

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  selectedIds: Set<string>;
  onContactClick: (contact: Contact) => void;
  onToggleSelect: (id: string) => void;
}

export function ContactList({ contacts, selectedContactId, selectedIds, onContactClick, onToggleSelect }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-gray-200" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">No contacts found</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {contacts.map((contact) => (
        <ContactRow
          key={contact.id}
          contact={contact}
          isActive={selectedContactId === contact.id}
          isSelected={selectedIds.has(contact.id)}
          onSelect={() => onToggleSelect(contact.id)}
          onClick={() => onContactClick(contact)}
        />
      ))}
    </div>
  );
}
