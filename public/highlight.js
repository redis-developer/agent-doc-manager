document.addEventListener("htmx:wsAfterMessage", (event) => {
  document.querySelectorAll("pre code").forEach((el) => {
    hljs.highlightElement(el);
  });
});

document.addEventListener("htmx:oobErrorNoTarget", (event) => {
  console.log(event);
});
