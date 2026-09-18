import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

const alignments = [
  { command: "justifyLeft", label: "Align left", icon: AlignLeft },
  { command: "justifyCenter", label: "Align center", icon: AlignCenter },
  { command: "justifyRight", label: "Align right", icon: AlignRight },
];

export default function RichTextEditor({ value, onChange, expanded = false }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  const saveSelection = () => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();

    if (!selection || !savedRangeRef.current) return;

    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
  };

  const updateToolbarState = () => {
    if (!editorRef.current) return;

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
    });
  };

  const command = (name, commandValue = null) => {
    const editor = editorRef.current;

    if (!editor) return;

    editor.focus();

    restoreSelection();

    document.execCommand(name, false, commandValue);

    onChange(editor.innerHTML);

    saveSelection();
    updateToolbarState();
  };

  const toolbarAction =
    (name, commandValue = null) =>
    (event) => {
      event.preventDefault();
      command(name, commandValue);
    };

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (
        editor &&
        selection &&
        selection.rangeCount > 0 &&
        editor.contains(selection.anchorNode)
      ) {
        saveSelection();
        updateToolbarState();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  return (
    <div className={`rich-text-editor ${expanded ? "is-expanded" : ""}`}>
      <div
        className="formatting-toolbar"
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Text formatting"
      >
        <select
          aria-label="Font family"
          defaultValue="Inter"
          onMouseDown={saveSelection}
          onChange={(event) => command("fontName", event.target.value)}
        >
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>

        <select
          aria-label="Font size"
          defaultValue="3"
          onMouseDown={saveSelection}
          onChange={(event) => command("fontSize", event.target.value)}
        >
          <option value="1">12px</option>
          <option value="2">14px</option>
          <option value="3">16px</option>
          <option value="4">18px</option>
          <option value="5">24px</option>
          <option value="6">32px</option>
          <option value="7">40px</option>
        </select>

        <input
          className="color-input"
          type="color"
          aria-label="Text color"
          defaultValue="#292926"
          onMouseDown={saveSelection}
          onChange={(event) => command("foreColor", event.target.value)}
        />

        <span className="format-divider" />

        <button
          type="button"
          className={activeFormats.bold ? "is-active" : ""}
          onMouseDown={toolbarAction("bold")}
          title="Bold"
          aria-label="Bold"
          aria-pressed={activeFormats.bold}
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          className={activeFormats.italic ? "is-active" : ""}
          onMouseDown={toolbarAction("italic")}
          title="Italic"
          aria-label="Italic"
          aria-pressed={activeFormats.italic}
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          className={activeFormats.underline ? "is-active" : ""}
          onMouseDown={toolbarAction("underline")}
          title="Underline"
          aria-label="Underline"
          aria-pressed={activeFormats.underline}
        >
          <Underline size={14} />
        </button>

        <span className="format-divider" />

        {alignments.map(({ command: name, label, icon: Icon }) => (
          <button
            type="button"
            key={name}
            className={activeFormats[name] ? "is-active" : ""}
            onMouseDown={toolbarAction(name)}
            title={label}
            aria-label={label}
            aria-pressed={activeFormats[name]}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        className="rich-text-content"
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        data-placeholder="Write something meaningful…"
        dangerouslySetInnerHTML={{
          __html: value || "",
        }}
        onInput={(event) => {
          onChange(event.currentTarget.innerHTML);
          saveSelection();
          updateToolbarState();
        }}
        onKeyUp={() => {
          saveSelection();
          updateToolbarState();
        }}
        onMouseUp={() => {
          saveSelection();
          updateToolbarState();
        }}
        onFocus={() => {
          saveSelection();
          updateToolbarState();
        }}
      />
    </div>
  );
}
