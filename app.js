(() => {
  const project = window.PROJECT;
  const $ = (selector) => document.querySelector(selector);
  const storage = {
    read(key) { try { return JSON.parse(localStorage.getItem(`goo-${key}`) || '[]'); } catch { return []; } },
    write(key, value) { try { localStorage.setItem(`goo-${key}`, JSON.stringify([...value])); } catch {} }
  };
  let direction = Math.min(2, Math.max(0, Number(new URLSearchParams(location.search).get('direction')) || 0));
  let category = 'Todos';
  let query = '';
  let sort = 'featured';
  const selected = new Set(storage.read('selection'));
  const favorites = new Set(storage.read('favorites'));
  const compared = new Set();
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const contactUrl = (message) => `https://wa.me/${project.phone}?text=${encodeURIComponent(message)}`;
  const ask = (model) => contactUrl(model ? `Oi! Vi o modelo ${model.name} no catálogo e queria consultar alguns detalhes.` : 'Oi! Vi o catálogo da GoO e gostaria de conversar com a equipe.');
  const productByName = (name) => project.products.find((product) => product.name === name);

  document.querySelectorAll('.wa-link').forEach((link) => { link.href = ask(); });

  function renderHero() {
    const first = project.products[0];
    if (direction === 0) {
      return `<section class="hero split"><div class="hero-copy"><p class="kicker">${project.eyebrow} · ${project.place}</p><h1>${project.headline}</h1><p>${project.lead}</p><div class="hero-actions"><a class="button dark" href="#catalogo">Explorar modelos ↓</a><a class="text-link wa-link" target="_blank" rel="noreferrer">Conversar com a equipe ↗</a></div><span class="hero-mark">01 — CATÁLOGO GoO</span></div><div class="hero-photo"><img src="images/${first.img}" alt="${escape(first.alt)}"><small>${first.name} · foto publicada pela GoO</small></div></section>`;
    }
    if (direction === 1) {
      return `<section class="hero stacked"><div class="hero-photo"><img src="images/${first.img}" alt="${escape(first.alt)}"><span class="photo-title">GoO<br><i>em movimento.</i></span></div><div class="hero-copy"><p class="kicker">${project.eyebrow}</p><h1>Detalhes para escolher com mais clareza.</h1><p>${project.lead} A ficha e a disponibilidade atuais são confirmadas com a loja.</p><a class="button dark" href="#catalogo">Ver modelos e comparar ↘</a><span class="hero-mark">02 — FICHA & COMPARAÇÃO · ${project.place}</span></div></section>`;
    }
    const categories = project.categories.filter((item) => item !== 'Todos');
    const cards = categories.map((item, index) => {
      const model = project.products.find((product) => product.category === item);
      if (!model) return '';
      const support = item === 'Bikes' ? 'Bicicletas elétricas' : 'Scooters elétricas';
      return `<button class="guide-tile" type="button" data-category="${escape(item)}"><img src="images/${model.img}" alt="${escape(model.alt)}"><span>0${index + 1} / ${escape(item)}</span><b>${support}</b><i>Ver modelos ↗</i></button>`;
    }).join('');
    return `<section class="hero guided"><div class="hero-copy"><p class="kicker">${project.eyebrow}</p><h1>O que faz parte da sua rotina?</h1><p>Comece pelo tipo de veículo, compare os modelos e leve sua pergunta à equipe.</p><span class="hero-mark">03 — ESCOLHA POR CATEGORIA · ${project.place}</span></div><div class="guide-choices">${cards}</div></section>`;
  }

  function filteredProducts() {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    let items = project.products.filter((product) => (category === 'Todos' || product.category === category) && (!term || `${product.name} ${product.category}`.toLocaleLowerCase('pt-BR').includes(term)));
    if (sort === 'az') items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    if (sort === 'za') items = [...items].sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
    return items;
  }

  function renderProducts() {
    const products = filteredProducts();
    $('#resultCount').textContent = `${products.length} ${products.length === 1 ? 'modelo' : 'modelos'}`;
    $('#productGrid').innerHTML = products.length ? products.map((product) => {
      const name = escape(product.name);
      return `<article class="product-card"><button class="photo" type="button" data-detail="${name}" aria-label="Ver detalhes de ${name}"><img src="images/${product.img}" alt="${escape(product.alt)}" loading="lazy"><span class="photo-index">${escape(product.category)}</span><span class="photo-open">Ver detalhes ↗</span></button><div class="product-info"><p class="kicker">${escape(product.category)} · GoO</p><h3>${name}</h3><p>${escape(product.detail)}</p><div class="card-actions"><a href="${ask(product)}" target="_blank" rel="noreferrer">Perguntar sobre o modelo ↗</a><button class="favorite" type="button" data-favorite="${name}" aria-label="${favorites.has(product.name) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}: ${name}" aria-pressed="${favorites.has(product.name)}">${favorites.has(product.name) ? '♥' : '♡'}</button><label class="pick"><input type="checkbox" data-compare="${name}" ${compared.has(product.name) ? 'checked' : ''}> Comparar</label><button class="selection-add" type="button" data-select="${name}" aria-pressed="${selected.has(product.name)}">${selected.has(product.name) ? 'Na minha seleção ✓' : 'Salvar modelo +'}</button></div></div></article>`;
    }).join('') : '<p class="empty">Não encontramos modelos com esse filtro. Tente outra busca.</p>';
    $('#compareCount').textContent = compared.size;
    $('#compare').setAttribute('aria-pressed', String(compared.size > 0));
    $('#compare').classList.toggle('compare-active', compared.size > 0);
  }

  function render() {
    const scrollY = window.scrollY;
    document.body.dataset.direction = String(direction);
    $('#experience').innerHTML = renderHero();
    $('#filters').innerHTML = project.categories.map((item) => `<button class="filter ${category === item ? 'active' : ''}" type="button" data-filter="${escape(item)}" aria-pressed="${category === item}">${escape(item)}</button>`).join('');
    document.querySelectorAll('.wa-link').forEach((link) => { link.href = ask(); });
    $('#designToggle').innerHTML = `<span class="toggle-desktop">Trocar design <b>0${direction + 1} / 03 · ${escape(project.directions[direction][0])}</b> ↗</span><span class="toggle-mobile"><b>Design 0${direction + 1} / 03</b> ↗</span>`;
    $('#designToggle').setAttribute('aria-label', `Trocar design. Direção atual: ${project.directions[direction][0]}. Ative para ver a próxima.`);
    $('#designToggle').title = project.directions[direction][1];
    renderProducts();
    renderSelectionCount();
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  }

  function renderSelectionCount() {
    $('#selectionCount').textContent = selected.size;
    $('#selectionItems').innerHTML = selected.size ? `<ul class="selection-list">${[...selected].map((name) => productByName(name)).filter(Boolean).map((product) => `<li><span>${escape(product.name)} <small>${escape(product.category)}</small></span><button type="button" data-remove="${escape(product.name)}" aria-label="Remover ${escape(product.name)} da seleção">Remover</button></li>`).join('')}</ul>` : '<p class="empty-selection">Sua seleção está vazia. Salve um modelo para consultar a equipe depois.</p>';
    const names = [...selected].filter(productByName);
    const text = names.length ? `Oi! Vi o catálogo da GoO e gostaria de conversar sobre: ${names.join(', ')}.` : 'Oi! Vi o catálogo da GoO e gostaria de conversar com a equipe.';
    $('#selectionContact').href = contactUrl(text);
    $('#selectionContact').classList.toggle('is-disabled', !names.length);
    $('#selectionContact').setAttribute('aria-disabled', String(!names.length));
  }

  function openDetails(name) {
    const product = productByName(name);
    if (!product) return;
    $('#detailContent').innerHTML = `<div class="detail-layout"><img src="images/${product.img}" alt="${escape(product.alt)}"><div><p class="kicker">${escape(product.category)} · GoO</p><h2>${escape(product.name)}</h2><p>${escape(product.detail)}</p><dl class="detail-facts"><div><dt>Categoria</dt><dd>${escape(product.category)}</dd></div><div><dt>Ficha técnica</dt><dd>Consulte a equipe</dd></div><div><dt>Valor e disponibilidade</dt><dd>Confirme com a loja</dd></div></dl><div class="detail-actions"><a class="button dark" href="${ask(product)}" target="_blank" rel="noreferrer">Perguntar sobre ${escape(product.name)} ↗</a><button type="button" class="selection-add" data-select="${escape(product.name)}" aria-pressed="${selected.has(product.name)}">${selected.has(product.name) ? 'Na minha seleção ✓' : 'Salvar na minha seleção +'}</button></div></div></div>`;
    $('#detailDialog').showModal();
  }

  function openComparison() {
    const list = [...compared].map(productByName).filter(Boolean);
    $('#compareTable').innerHTML = list.length ? `<div class="compare-table">${list.map((product) => `<article><img src="images/${product.img}" alt="${escape(product.alt)}"><p class="kicker">${escape(product.category)}</p><h3>${escape(product.name)}</h3><p>${escape(product.detail)}</p><a href="${ask(product)}" target="_blank" rel="noreferrer">Perguntar sobre o modelo ↗</a></article>`).join('')}</div>` : '<p>Ative “Comparar” e marque os modelos que quer ver lado a lado. Você pode selecionar até três.</p>';
    $('#compareDialog').showModal();
  }

  $('#designToggle').addEventListener('click', () => { direction = (direction + 1) % 3; render(); });
  $('#search').addEventListener('input', (event) => { query = event.target.value; renderProducts(); });
  $('#sortSelect').addEventListener('change', (event) => { sort = event.target.value; renderProducts(); });
  $('#compare').addEventListener('click', openComparison);
  $('#selectionOpen').addEventListener('click', () => { renderSelectionCount(); $('#selectionDialog').showModal(); });

  document.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-compare]');
    if (!checkbox) return;
    const name = checkbox.dataset.compare;
    if (checkbox.checked && compared.size >= 3) { checkbox.checked = false; return; }
    checkbox.checked ? compared.add(name) : compared.delete(name);
    $('#compareCount').textContent = compared.size;
    $('#compare').setAttribute('aria-pressed', String(compared.size > 0));
    $('#compare').classList.toggle('compare-active', compared.size > 0);
  });

  document.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) { category = filterButton.dataset.filter; render(); return; }
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) { category = categoryButton.dataset.category; render(); $('#catalogo').scrollIntoView({ behavior: 'smooth' }); return; }
    const detailButton = event.target.closest('[data-detail]');
    if (detailButton) { openDetails(detailButton.dataset.detail); return; }
    const favoriteButton = event.target.closest('[data-favorite]');
    if (favoriteButton) {
      const name = favoriteButton.dataset.favorite;
      favorites.has(name) ? favorites.delete(name) : favorites.add(name);
      storage.write('favorites', favorites);
      renderProducts(); return;
    }
    const selectionButton = event.target.closest('[data-select]');
    if (selectionButton) {
      const name = selectionButton.dataset.select;
      selected.has(name) ? selected.delete(name) : selected.add(name);
      storage.write('selection', selected);
      renderProducts(); renderSelectionCount(); return;
    }
    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) {
      selected.delete(removeButton.dataset.remove);
      storage.write('selection', selected);
      renderProducts(); renderSelectionCount();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  });
  render();
})();
