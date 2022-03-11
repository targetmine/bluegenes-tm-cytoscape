const Cymine = require('./cs-intermine/slim');

// make sure to export main, with the signature
function main(el, service, imEntity, state, config) {
	if (!state) state = {};
	if (!el || !service || !imEntity || !state || !config) {
		throw new Error('Call main with correct signature');
	}

	var entity = imEntity.Gene || imEntity.Protein;

	var innerElem = document.createElement('div');
	el.appendChild(innerElem);

	var paths = { Gene: 'Gene.id', Protein: 'Gene.proteins.id' };
	var initOptions = {
		parentElem: innerElem,
		service: service,
		queryOn: {
			value: entity.value,
			op: '=',
			path: paths[entity.class]
		},
		nodeType: entity.class,
		compact: true //optional
	};

	Cymine(initOptions);
}

module.exports = { main };
