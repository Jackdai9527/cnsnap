"use client";

import { FileSpreadsheet, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import type { MediaAssetSummary } from "@/components/admin/UppyMediaUploader";

type EditorModule = typeof import("ckeditor5");
type EditorConfig = import("ckeditor5").EditorConfig;
type HtmlEditorInstance = {
  getData: () => string;
  setData: (data: string) => void;
};

type HtmlEditorProps = {
  name: string;
  defaultValue?: string | null;
  minHeight?: number;
};

export function HtmlEditor({ name, defaultValue = "", minHeight = 260 }: HtmlEditorProps) {
  const [data, setData] = useState(defaultValue ?? "");
  const [editorModule, setEditorModule] = useState<EditorModule | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const editorRef = useRef<HtmlEditorInstance | null>(null);

  useEffect(() => {
    let mounted = true;
    import("ckeditor5").then((mod) => {
      if (mounted) setEditorModule(mod);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const editorConfig: EditorConfig | undefined = editorModule
    ? {
        licenseKey: "GPL",
        plugins: [
          editorModule.Essentials,
          editorModule.Paragraph,
          editorModule.Heading,
          editorModule.Bold,
          editorModule.Italic,
          editorModule.Underline,
          editorModule.Strikethrough,
          editorModule.Link,
          editorModule.Alignment,
          editorModule.FontColor,
          editorModule.FontBackgroundColor,
          editorModule.FontFamily,
          editorModule.FontSize,
          editorModule.List,
          editorModule.BlockQuote,
          editorModule.RemoveFormat,
          editorModule.HorizontalLine,
          editorModule.PasteFromOffice,
          editorModule.Image,
          editorModule.ImageCaption,
          editorModule.ImageInsert,
          editorModule.ImageResize,
          editorModule.ImageStyle,
          editorModule.ImageToolbar,
          editorModule.ImageUpload,
          editorModule.LinkImage,
          editorModule.SimpleUploadAdapter,
          editorModule.Table,
          editorModule.TableToolbar,
          editorModule.TableProperties,
          editorModule.TableCellProperties,
          editorModule.GeneralHtmlSupport,
          editorModule.SourceEditing
        ],
        toolbar: {
          items: [
            "heading",
            "|",
            "fontFamily",
            "fontSize",
            "fontColor",
            "fontBackgroundColor",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "removeFormat",
            "|",
            "alignment",
            "|",
            "link",
            "bulletedList",
            "numberedList",
            "|",
            "insertImage",
            "blockQuote",
            "insertTable",
            "horizontalLine",
            "sourceEditing",
            "|",
            "undo",
            "redo"
          ],
          shouldNotGroupWhenFull: true
        },
        simpleUpload: {
          uploadUrl: "/api/admin/media"
        },
        image: {
          toolbar: [
            "imageTextAlternative",
            "toggleImageCaption",
            "|",
            "imageStyle:inline",
            "imageStyle:block",
            "imageStyle:side",
            "|",
            "resizeImage",
            "linkImage"
          ],
          resizeOptions: [
            { name: "resizeImage:original", value: null, label: "Original" },
            { name: "resizeImage:50", value: "50", label: "50%" },
            { name: "resizeImage:75", value: "75", label: "75%" }
          ]
        },
        fontColor: {
          colorPicker: { format: "hex" }
        },
        fontBackgroundColor: {
          colorPicker: { format: "hex" }
        },
        table: {
          contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties"
          ]
        },
        htmlSupport: {
          allow: [
            {
              name: /.*/,
              attributes: true,
              classes: true,
              styles: true
            }
          ]
        }
      }
    : undefined;

  async function uploadAttachment(file: File) {
    setUploadingAttachment(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/uploads/help", {
        method: "POST",
        body: formData
      });
      const payload = await response.json() as { url?: string; name?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "Upload failed.");

      const escapedName = escapeHtml(payload.name || file.name);
      const attachmentHtml = `<p><a class="help-attachment-link" href="${payload.url}" target="_blank" rel="noopener" download><strong>Download spreadsheet:</strong> ${escapedName}</a></p>`;
      const nextData = `${editorRef.current?.getData() || data}${attachmentHtml}`;
      setData(nextData);
      editorRef.current?.setData(nextData);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function insertMedia(asset: MediaAssetSummary) {
    const alt = escapeHtml(asset.altText || asset.originalName || "");
    const caption = asset.caption ? `<figcaption>${escapeHtml(asset.caption)}</figcaption>` : "";
    const imageHtml = `<figure class="image"><img src="${asset.url}" alt="${alt}">${caption}</figure>`;
    const nextData = `${editorRef.current?.getData() || data}${imageHtml}`;
    setData(nextData);
    editorRef.current?.setData(nextData);
  }

  return (
    <div className="html-editor space-y-3" style={{ ["--editor-min-height" as string]: `${minHeight}px` }}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Rich content tools</div>
            <p className="mt-1 text-xs font-semibold text-slate-500">Paste images and Office tables directly, upload images from the image button, or attach xlsx/csv files below.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-action gap-2 px-3 py-2" onClick={() => setMediaOpen(true)}>
              <ImagePlus size={15} />
              Media Library
            </button>
            <label className="admin-action gap-2 px-3 py-2">
              {uploadingAttachment ? <Loader2 className="animate-spin" size={15} /> : <FileSpreadsheet size={15} />}
              {uploadingAttachment ? "Uploading..." : "Insert XLSX / CSV"}
              <input
                type="file"
                className="sr-only"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                disabled={uploadingAttachment}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void uploadAttachment(file);
                }}
              />
            </label>
          </div>
        </div>
        {uploadError ? <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{uploadError}</div> : null}
      </div>
      <MediaLibraryPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={insertMedia} />
      <input type="hidden" name={name} value={data} />
      {editorModule ? (
        <CKEditor
          editor={editorModule.ClassicEditor}
          config={editorConfig}
          data={data}
          onReady={(editor) => {
            editorRef.current = editor as HtmlEditorInstance;
          }}
          onChange={(_, editor) => setData(editor.getData())}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <UploadCloud size={16} />
            Loading editor...
          </span>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
