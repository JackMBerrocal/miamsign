export function formatContractText(text: string): string {
  if (!text) return "";

  let formatted = text;

  if (formatted.includes("Plazo de Ejecución")) {
    formatted = formatted.replace(
      /\s*\*?Tiempo de entrega estimado:?\s*\*?\*?([0-9a-zA-ZáéíóúÁÉÍÓÚ\s]+)\*?\*?\*?(?!\s*sujeto)/gi,
      ""
    );
  } else {
    formatted = formatted.replace(
      /(?:\s*\*?Tiempo de entrega estimado:?\s*\*?\*?([0-9a-zA-ZáéíóúÁÉÍÓÚ\s]+)\*?\*?\*?)/gi,
      "\n\n**Cláusula 1.1.5. Plazo de Ejecución y Entrega:**\nEl tiempo de entrega estimado para la presentación de los entregables es de **$1**, sujeto a la oportuna entrega de insumos por parte de EL CLIENTE.\n\n"
    );
  }

  // Eliminar emojis y convertir viñetas en listas Markdown formales
  formatted = formatted.replace(/(?:\r?\n)?\s*(?:-\s*)?✔️\s*/g, "\n- ");
  formatted = formatted.replace(/[✅⚡🤝💳🎉⚠️📌]/g, "");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  return formatted;
}

export function splitContractIntoPages(content: string): string[] {
  if (!content) return [""];

  const formattedContent = formatContractText(content);
  const stripBreakComments = (s: string) => s.replace(/<!--\s*PAGE BREAK\s*-->/gi, "").trim();

  const p1Match = formattedContent.split(/## TÍTULO II:/);
  if (p1Match.length === 2) {
    const page1 = stripBreakComments(p1Match[0]);
    const rest1 = "## TÍTULO II:" + p1Match[1];

    const p2Match = rest1.split(/## TÍTULO III:/);
    if (p2Match.length === 2) {
      const page2 = stripBreakComments(p2Match[0]);
      const rest2 = "## TÍTULO III:" + p2Match[1];

      const p3Match = rest2.split(/## TÍTULO V:/);
      if (p3Match.length === 2) {
        const page3 = stripBreakComments(p3Match[0]);
        const page4 = stripBreakComments("## TÍTULO V:" + p3Match[1]);
        return [page1, page2, page3, page4].filter(Boolean);
      }
    }
  }

  if (formattedContent.includes("<!-- PAGE BREAK -->")) {
    const rawPages = formattedContent.split("<!-- PAGE BREAK -->");
    return rawPages.map((p) => stripBreakComments(p)).filter(Boolean);
  }

  const sections = formattedContent.split(/(?=## TÍTULO)/g);
  if (sections.length <= 1) {
    return [formattedContent];
  }

  const pages: string[] = [];
  let currentPage = "";
  for (let i = 0; i < sections.length; i++) {
    if (i === 0) {
      currentPage = sections[i];
    } else if (i === 1) {
      currentPage += "\n\n" + sections[i];
      pages.push(currentPage.trim());
      currentPage = "";
    } else if (i % 2 === 0) {
      if (currentPage) pages.push(currentPage.trim());
      currentPage = sections[i];
    } else {
      currentPage += "\n\n" + sections[i];
      pages.push(currentPage.trim());
      currentPage = "";
    }
  }
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  return pages.length > 0 ? pages : [formattedContent];
}
