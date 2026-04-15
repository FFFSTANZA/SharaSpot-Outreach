"use client";

import { Contact } from "@/types";
import { ContactRow } from "./ContactRow";

interface ContactListProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export function ContactList({ contacts, onContactClick }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-[#F1F3F4] p-4 rounded-full mb-4">
          <svg className="h-8 w-8 text-[#9AA0A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#1A1D21]">No contacts found</h3>
        <p className="text-[#5F6368] max-w-sm mt-1">
          Contacts will appear here once you start a campaign or add them manually.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8F9FA] border-b border-[#E8EAED]">
            <th className="px-6 py-3 text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Stage</th>
            <th className="px-6 py-3 text-xs font-semibold text-[#5F6368] uppercase tracking-wider">Tags</th>
            <th className="px-6 py-3 text-xs font-semibold text-[#5F6368] uppercase tracking-wider text-right">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8EAED]">
          {contacts.map((contact) => (
            <ContactRow 
              key={contact.id} 
              contact={contact} 
              onClick={() => onContactClick(contact)} 
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
