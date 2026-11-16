export default function decorate(block) {
  const list = document.createElement('ol');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const item = document.createElement('li');
    cells.forEach((cell, index) => {
      const hasImage = cell.querySelector('img');
      if (hasImage && index === 0) cell.classList.add('steps-icon');
      else if (hasImage && index === cells.length - 1) cell.classList.add('steps-arrow');
      else cell.classList.add('steps-copy');
      item.append(cell);
    });
    list.append(item);
  });

  block.replaceChildren(list);
}
