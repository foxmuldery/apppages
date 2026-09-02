document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const checksum = button.parentElement?.querySelector("code")?.textContent?.trim();
    if (!checksum) return;
    try {
      await navigator.clipboard.writeText(checksum);
      const previous = button.textContent;
      button.textContent = "已复制";
      window.setTimeout(() => { button.textContent = previous; }, 1400);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(button.parentElement.querySelector("code"));
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
});
