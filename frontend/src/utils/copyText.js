export async function copyText(text) {
  const canUseClipboard = !!navigator.clipboard?.writeText;

  if (canUseClipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard failed:", err);
    }
  }

  if (typeof document?.execCommand !== "function") {
    console.warn("execCommand copy fallback not available.");
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
