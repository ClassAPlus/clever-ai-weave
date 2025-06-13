
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const focusTextarea = (textarea: HTMLTextAreaElement | null, setToEnd = false) => {
  if (!textarea) return;
  
  textarea.focus({ preventScroll: true });
  
  if (setToEnd) {
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  } else {
    textarea.setSelectionRange(0, 0);
  }
};
