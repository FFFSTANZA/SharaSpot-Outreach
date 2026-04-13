"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import { useEffect, useCallback, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Undo2, Redo2,
  Link as LinkIcon, Unlink, Highlighter, Minus, Type,
  Heading1, Heading2, Heading3, RemoveFormatting,
  Table as TableIcon, ChevronDown, Variable, Scissors, Image as ImageIcon, Smile
} from "lucide-react";
import GiphyPicker from "./GiphyPicker";

interface EditorProps {
  value?: string;
  onChange: (html: string) => void;
  variables?: string[];
  snippets?: { name: string; content: string }[];
}

function ToolbarButton({
  onClick, isActive = false, disabled = false, children, title,
}: {
  onClick: () => void; isActive?: boolean; disabled?: boolean;
  children: React.ReactNode; title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        h-10 w-10 md:h-8 md:w-8 flex-shrink-0
        flex items-center justify-center rounded-lg md:rounded-md
        transition-all duration-150 active:scale-95
        ${isActive
          ? "bg-blue-100 text-blue-700"
          : disabled
            ? "text-gray-500 cursor-not-allowed"
            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200"
        }
      `}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-0.5 md:mx-1 h-5 w-px bg-gray-200 flex-shrink-0" />;
}

const FONT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Green", value: "#059669" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#9333ea" },
  { label: "Gray", value: "#6b7280" },
];

export function Editor({ value = "", onChange, variables = [], snippets = [] }: EditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [showSnippetDropdown, setShowSnippetDropdown] = useState(false);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-emerald-600 underline cursor-pointer" },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "Write your email..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] md:min-h-[380px] px-3 md:px-5 py-3 md:py-5 text-sm text-gray-800 outline-none leading-relaxed " +
          "prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 " +
          "prose-blockquote:border-l-emerald-500 prose-blockquote:text-gray-600 " +
          "prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-emerald-600 prose-code:text-xs " +
          "prose-a:text-emerald-600 prose-a:underline",
      },
    },
  });

  useEffect(() => {
    if (editor && value && !editor.isFocused && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const iconSize = "h-4 w-4";

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`{{${variable}}}`).run();
    setShowVariableDropdown(false);
  };

  const insertSnippet = (content: string) => {
    editor.chain().focus().insertContent(content).run();
    setShowSnippetDropdown(false);
  };

  const insertGif = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
    setShowGiphyPicker(false);
  };

  return (
    <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex items-center gap-0.5 px-2 md:px-3 py-2 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm md:flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 className={iconSize} />
        </ToolbarButton>

        <ToolbarDivider />

        <div className="hidden md:flex items-center gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph") && !editor.isActive("heading")} title="Normal text">
            <Type className={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className={iconSize} />
          </ToolbarButton>
          <ToolbarDivider />
        </div>

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold">
          <Bold className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic">
          <Italic className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className={iconSize} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Color Picker */}
        <div className="relative">
          <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} isActive={showColorPicker} title="Text color">
            <div className="flex flex-col items-center">
              <Type className="h-3.5 w-3.5" />
              <div className="h-0.5 w-3.5 rounded-full mt-0.5"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000" }} />
            </div>
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 flex gap-1.5">
              {FONT_COLORS.map((c) => (
                <button key={c.label} type="button" title={c.label}
                  onClick={() => {
                    c.value ? editor.chain().focus().setColor(c.value).run() : editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  className="h-7 w-7 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value || "#1f2937" }} />
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Variables Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVariableDropdown(!showVariableDropdown)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Variable className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Variables</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showVariableDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
              {variables.length > 0 ? (
                variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {`{{${v}}}`}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No variables found. Upload a CSV to see more.</div>
              )}
            </div>
          )}
        </div>

        {/* Snippets Dropdown */}
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setShowSnippetDropdown(!showSnippetDropdown)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Scissors className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Snippets</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showSnippetDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
              {snippets.length > 0 ? (
                snippets.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => insertSnippet(s.content)}
                    className="w-full text-left px-3 py-2 transition-colors hover:bg-emerald-50 group"
                  >
                    <div className="text-sm font-medium text-gray-900 group-hover:text-emerald-700">{s.name}</div>
                    <div className="text-xs text-gray-500 truncate">{s.content.replace(/<[^>]*>/g, '')}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No snippets saved.</div>
              )}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Media Buttons */}
        <ToolbarButton onClick={() => setShowGiphyPicker(true)} title="Insert GIF">
          <Smile className={iconSize} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Table support */}
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
        >
          <TableIcon className={iconSize} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet list">
          <List className={iconSize} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.isActive("link") ? editor.chain().focus().unsetLink().run() : setShowSnippetDropdown(true)}
          isActive={editor.isActive("link")}
          title="Insert link"
        >
          <LinkIcon className={iconSize} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      {showGiphyPicker && (
        <GiphyPicker onSelect={insertGif} onClose={() => setShowGiphyPicker(false)} />
      )}
    </div>
  );
}
