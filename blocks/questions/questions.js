function hasContent(row) {
  return [...row.children].some((cell) => cell.textContent.trim() || cell.querySelector('img'));
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const calloutRow = rows.find((row) => row.querySelector('img, h2 a'))
    || (rows[0].children.length > 1 ? rows[0] : null);
  const headingRow = rows.find((row) => row !== calloutRow && row.querySelector('h2'));
  const cardRows = rows.filter((row) => (
    row !== calloutRow && row !== headingRow && hasContent(row)
  ));
  const content = [];

  if (calloutRow && hasContent(calloutRow)) {
    calloutRow.classList.add('questions-callout');
    content.push(calloutRow);
  }

  const panel = document.createElement('div');
  panel.className = 'questions-panel';

  if (headingRow || cardRows.length) {
    const cards = document.createElement('div');
    cards.className = 'questions-cards';

    if (headingRow) {
      headingRow.classList.add('questions-heading');
      cards.append(headingRow);
    }

    cardRows.forEach((row) => {
      row.classList.add('questions-question-row');
      cards.append(row);
    });
    panel.append(cards);
  }

  if (panel.childElementCount) content.push(panel);
  block.replaceChildren(...content);
}
