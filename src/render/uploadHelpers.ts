import {NativeQuestion} from "../models/types";
import {placeholder} from "../services/placeholder";
import {parseTitle} from "./helpers";

export type UploadKind = "image" | "file";

// Custom properties stashed on the native <input> so the form's (synchronous)
// answer collection can read the already-encoded file payloads at submit time.
const VALUES_PROP = "__mfUploadValues";
const READY_PROP = "__mfUploadReady";

const ICONS = {
    uploadCloud:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 16l-4-4-4 4"/><path d="M12 12v9"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
    image:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    file:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    remove:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
};

export function formatFileSize(bytes: number): string {
    if (typeof bytes !== "number" || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** Reads the encoded file payloads stashed on a native upload input. */
export function getUploadValues(input: HTMLInputElement): string[] {
    const values = (input as any)[VALUES_PROP];
    return Array.isArray(values) ? values : [];
}

/** Awaits any in-flight base64 encoding for the upload inputs under `root`. */
export async function awaitUploadReady(root: ParentNode | null | undefined): Promise<void> {
    if (!root) return;
    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>(".magicfeedback-upload-native"));
    await Promise.all(inputs.map((i) => (i as any)[READY_PROP]).filter(Boolean));
}

function buildHint(
    language: string,
    kind: UploadKind,
    multiple: boolean,
    maxFiles: number,
    maxFileSizeMb: number
): string {
    const parts = [placeholder.upload.formats(language, kind)];
    if (multiple && maxFiles > 0) parts.push(placeholder.upload.maxFiles(language, maxFiles));
    if (maxFileSizeMb > 0) parts.push(placeholder.upload.maxSize(language, maxFileSizeMb));
    return parts.filter(Boolean).join(" · ");
}

/**
 * Builds an enhanced upload control: a styled drag & drop dropzone with a
 * selected-files preview list, wrapped around a real (visually hidden) native
 * file input so answer collection and native `required` validation keep working.
 *
 * Selected files are encoded to base64 data URIs (as a JSON payload with name,
 * type and size) and stashed on the input, so the survey submission includes
 * the file contents inside the answer's `value` array.
 */
export function createUploadControl(
    question: NativeQuestion,
    language: string,
    kind: UploadKind
): {element: HTMLElement; elementTypeClass: string} {
    const {ref, require, title, assets} = question;
    const elementTypeClass = kind === "image" ? "magicfeedback-upload-image" : "magicfeedback-upload-file";
    const multiple = assets?.multiple || false;
    // 0 = unlimited. When single selection is forced, cap at 1.
    const maxFiles = multiple ? (assets?.maxFiles || 0) : 1;
    const maxFileSizeMb = Number(assets?.maxFileSize) > 0 ? Number(assets?.maxFileSize) : 0;
    const maxBytes = maxFileSizeMb * 1024 * 1024;

    const wrapper = document.createElement("div");
    wrapper.classList.add("magicfeedback-upload");

    // Real native input. Keeps `magicfeedback-input` + the type class first so
    // the form's answer collection (which reads classList[0]) stays compatible.
    const input = document.createElement("input");
    input.type = "file";
    if (kind === "image") input.accept = "image/*";
    input.multiple = multiple;
    input.required = require;
    input.name = ref;
    input.id = `magicfeedback-upload-input-${ref}`;
    input.classList.add(elementTypeClass);
    input.classList.add("magicfeedback-input");
    input.classList.add("magicfeedback-upload-native");
    (input as any)[VALUES_PROP] = [];
    (input as any)[READY_PROP] = Promise.resolve();
    const ariaLabel = parseTitle(title, language);
    if (ariaLabel) input.setAttribute("aria-label", ariaLabel);

    // Visual dropzone (the input is an invisible overlay covering it).
    const dropzone = document.createElement("div");
    dropzone.classList.add("magicfeedback-upload-dropzone");

    const icon = document.createElement("span");
    icon.classList.add("magicfeedback-upload-icon");
    icon.innerHTML = kind === "image" ? ICONS.image : ICONS.uploadCloud;

    const cta = document.createElement("span");
    cta.classList.add("magicfeedback-upload-cta");
    cta.textContent = placeholder.upload.cta(language);

    const hint = document.createElement("span");
    hint.classList.add("magicfeedback-upload-hint");
    hint.textContent = buildHint(language, kind, multiple, maxFiles, maxFileSizeMb);

    dropzone.appendChild(input);
    dropzone.appendChild(icon);
    dropzone.appendChild(cta);
    dropzone.appendChild(hint);

    const errorEl = document.createElement("div");
    errorEl.classList.add("magicfeedback-upload-error");

    const list = document.createElement("ul");
    list.classList.add("magicfeedback-upload-list");

    wrapper.appendChild(dropzone);
    wrapper.appendChild(errorEl);
    wrapper.appendChild(list);

    // --- Encoding (files -> base64 JSON payload), cached per File object ---
    const payloadCache = new WeakMap<File, string>();
    const fileToPayload = (file: File): Promise<string> => {
        const cached = payloadCache.get(file);
        if (cached) return Promise.resolve(cached);
        return new Promise((resolve) => {
            const reader = new FileReader();
            const finish = (content: string) => {
                const payload = JSON.stringify({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content,
                });
                payloadCache.set(file, payload);
                resolve(payload);
            };
            reader.onload = () => finish(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => finish("");
            reader.readAsDataURL(file);
        });
    };

    const syncValues = (): void => {
        const files = Array.from(input.files || []);
        const ready = Promise.all(files.map(fileToPayload)).then((payloads) => {
            (input as any)[VALUES_PROP] = payloads;
        });
        (input as any)[READY_PROP] = ready;
    };

    // --- File state & rendering ---
    const objectUrls: string[] = [];
    const clearObjectUrls = () => {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        objectUrls.length = 0;
    };

    // Reassigns the input's FileList (respecting maxFiles) without firing `change`.
    // Falls back to the browser-provided selection where DataTransfer is missing.
    const assignFiles = (files: File[]) => {
        try {
            const capped = maxFiles > 0 ? files.slice(0, maxFiles) : files;
            const dt = new DataTransfer();
            capped.forEach((f) => dt.items.add(f));
            input.files = dt.files;
        } catch (e) {
            // DataTransfer unsupported: keep whatever the browser already set.
        }
        renderList();
        syncValues();
    };

    const showRejected = (rejected: File[]): void => {
        if (!rejected.length) {
            errorEl.textContent = "";
            errorEl.classList.remove("is-visible");
            return;
        }
        const names = rejected.map((f) => f.name).join(", ");
        errorEl.textContent = `${placeholder.upload.tooLarge(language, maxFileSizeMb)}: ${names}`;
        errorEl.classList.add("is-visible");
    };

    const filterBySize = (files: File[]): {accepted: File[]; rejected: File[]} => {
        if (!maxBytes) return {accepted: files, rejected: []};
        const accepted: File[] = [];
        const rejected: File[] = [];
        files.forEach((f) => (f.size <= maxBytes ? accepted : rejected).push(f));
        return {accepted, rejected};
    };

    function renderList(): void {
        clearObjectUrls();
        list.innerHTML = "";
        const files = Array.from(input.files || []);
        wrapper.classList.toggle("magicfeedback-upload--has-files", files.length > 0);

        files.forEach((file, index) => {
            const item = document.createElement("li");
            item.classList.add("magicfeedback-upload-file-item");

            const thumb = document.createElement("span");
            thumb.classList.add("magicfeedback-upload-thumb");
            if (kind === "image" && file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                objectUrls.push(url);
                const img = document.createElement("img");
                img.src = url;
                img.alt = file.name;
                thumb.appendChild(img);
            } else {
                thumb.innerHTML = ICONS.file;
            }

            const info = document.createElement("span");
            info.classList.add("magicfeedback-upload-file-info");
            const name = document.createElement("span");
            name.classList.add("magicfeedback-upload-file-name");
            name.textContent = file.name;
            name.title = file.name;
            const size = document.createElement("span");
            size.classList.add("magicfeedback-upload-file-size");
            size.textContent = formatFileSize(file.size);
            info.appendChild(name);
            info.appendChild(size);

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.classList.add("magicfeedback-upload-remove");
            removeBtn.setAttribute("aria-label", `${placeholder.upload.remove(language)}: ${file.name}`);
            removeBtn.innerHTML = ICONS.remove;
            removeBtn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                assignFiles(Array.from(input.files || []).filter((_, i) => i !== index));
            });

            item.appendChild(thumb);
            item.appendChild(info);
            item.appendChild(removeBtn);
            list.appendChild(item);
        });
    }

    // Native selection: validate size and cap to maxFiles.
    input.addEventListener("change", () => {
        const {accepted, rejected} = filterBySize(Array.from(input.files || []));
        showRejected(rejected);
        assignFiles(accepted);
    });

    // --- Drag & drop ---
    const stop = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    ["dragenter", "dragover"].forEach((evt) =>
        dropzone.addEventListener(evt, (event) => {
            stop(event);
            dropzone.classList.add("is-dragover");
        })
    );
    ["dragleave", "dragend"].forEach((evt) =>
        dropzone.addEventListener(evt, (event) => {
            stop(event);
            dropzone.classList.remove("is-dragover");
        })
    );
    dropzone.addEventListener("drop", (event) => {
        stop(event);
        dropzone.classList.remove("is-dragover");
        const transfer = (event as DragEvent).dataTransfer;
        let dropped = transfer ? Array.from(transfer.files) : [];
        if (kind === "image") dropped = dropped.filter((f) => f.type.startsWith("image/"));
        if (!dropped.length) return;
        const {accepted, rejected} = filterBySize(dropped);
        showRejected(rejected);
        if (!accepted.length) return;
        const existing = multiple ? Array.from(input.files || []) : [];
        assignFiles(existing.concat(accepted));
    });

    return {element: wrapper, elementTypeClass};
}
