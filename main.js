/** 
 * @param {string} spec
 * @param {(Node | string)[]} children
 * @returns {Element}
 */
function $(spec, ...children) {
	let elem;

	for (const match of spec.matchAll(/(^[^.#]*)|([.#])([^.#]*)/g)) {
		const [_, name, sign, content] = match;

		if (name != null) elem = document.createElement(name);

		if (sign === '#') elem.id = content;
		else if (sign === '.') elem.classList.add(content);
	}

	elem.append(...children);
	return elem;
}

function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class Entry {
	constructor(word, pos, definition, antonymDefinition, keywords, elem, hintE) {
		this.word = word;
		this.pos = pos;
		this.definition = definition;
		this.antonymDefinition = antonymDefinition;
		this.keywords = keywords;
		this.elem = elem;
		this.hintE = hintE;
	}
}

const entries = [];

const searchInputE = document.querySelector('#search-input');
const mobileSearchInputE = document.querySelector('#mobile-search-input');
const themeButtonE = document.querySelector('#theme-button');
const wordsE = document.querySelector('#words');

const data = await (await fetch('data.json')).json();
console.log(data);

for (const entry of data) {
	const entryMainE = $('div.entry-main',
		$('div.entry-term.entry-term-plain',
			$('div.entry-title',
				$('h3.entry-word', entry.word),
				$('small.entry-pos', entry.pos)
			),
			$('p.entry-definition', entry.definition)
		),
	);
	const entryHintE = $('small.entry-hint');
	const entryE = $('div.entry', entryMainE, entryHintE);

	if (entry.antonymDefinition) {
		entryMainE.append(
			$('div.entry-term.entry-term-antonym',
				$('div.entry-title',
					$('h3.entry-word', 'Vöt' + entry.word)
				),
				$('p.entry-definition', entry.antonymDefinition)
			)
		);
	}

	entries.push(new Entry(entry.word, entry.pos, entry.definition, entry.antonymDefinition, entry.keywords ?? [], entryE, entryHintE));
	wordsE.append(entryE);
}

function search(query) {
		const wordMatches = new Set();
	const definitionWholeMatches = new Set();
	const definitionMatches = new Set();
	const keywordMatches = new Map();

	const escaped = escapeRegExp(query);
	const queryRegex = new RegExp(escaped, 'i');
	const queryWholeRegex = new RegExp(`\\b${escaped}\\b`, 'i');

	for (const entry of entries) {
		entry.hintE.innerHTML = '';

		if (queryWholeRegex.test(entry.definition) || queryWholeRegex.test(entry.antonymDefinition)) {
			definitionWholeMatches.add(entry);
			continue;
		}
		if (queryRegex.test(entry.definition) || queryRegex.test(entry.antonymDefinition)) {
			definitionMatches.add(entry);
			continue;
		}
		if (queryRegex.test(entry.word)) {
			wordMatches.add(entry);
			continue;
		}

		for (const keyword of entry.keywords) {
			if (!keyword.includes(query)) continue;
			
			let keywords = keywordMatches.get(entry);
			if (!keywords) {
				keywords = [];
				keywordMatches.set(entry, keywords);
			}
			keywords.push(keyword);
		}
	}

	wordsE.innerHTML = '';
	for (const entry of definitionWholeMatches) wordsE.append(entry.elem);
	for (const entry of definitionMatches) wordsE.append(entry.elem);
	for (const entry of wordMatches) wordsE.append(entry.elem);
	for (const [entry, keywords] of keywordMatches.entries()) {
		wordsE.append(entry.elem);
		entry.hintE.append(
			'matched ' + (keywords.length === 1 ? 'keyword' : 'keywords') + ' ',
			$('br')
		);
		for (const [i, keyword] of keywords.entries()) {
			if (i > 0) entry.hintE.append(', ');
			entry.hintE.append($('strong', keyword));
		}
	}
}

searchInputE.addEventListener('input', e => {
	search(e.target.value);
});

mobileSearchInputE.addEventListener('input', e => {
	search(e.target.value);
});

themeButtonE.addEventListener('click', () => {
	document.documentElement.classList.toggle('dark');
});