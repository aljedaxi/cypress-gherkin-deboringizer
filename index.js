const trace = s => {console.log(s); return s;};
const {
	K,
	either,
	show,
	Left,
	Right,
	lift2,
	prop,
	reverse,
  compose,
	reduce,
	encase,
	Just,
	Nothing,
	chain,
	last,
	unwords,
	concat,
	head,
	fromMaybe,
	maybe,
	words,
	reject,
	pipe,
	filter,
	elem,
	trim,
	splitOn,
	joinWith,
	map,
} = require ('sanctuary');
const {
	mkdirSync,
	appendFileSync,
	readFileSync,
} = require ('fs');

const properSteps = ['Given', 'When', 'Then'];
const fakeSteps = [ 'And', 'But'];
const steps = [...properSteps, ...fakeSteps];
const elemOf = xs => x => elem (x) (xs);

const firstWord = pipe([words, head]);
const firstWordIn = a => pipe([ firstWord, map (elemOf (a)), fromMaybe (false) ])

const doThings = d => f => pipe([splitOn(d), ...f, joinWith(d)]);

const preprocess = doThings ('') ([
	map(
		c => 
		c === '\t'     ? '  '
	: c === '​' ? ''
  : c === '“'      ? '"'
	: c === '”'      ? '"'
	: c
	),
]);

const oddsThenEvens = x => x.reduce(({odds = [], evens = []}, x, idx) =>
	isOdd (idx) ? {odds: [...odds, x], evens} : {evens: [...evens, x], odds}
	, {}
);

const whateverStupidShitYouUseToParseTheDatatable = 'const testData = processRawTable(rawTable);';

const parseStrings = s => {
  if (!s.includes('"')) return {remainingDescription: [s], args: []};
	const {odds: strings, evens: notStrings} = pipe([splitOn('"'), oddsThenEvens, map(filter(Boolean))])(s);
	const remainingDescription = strings.map((s, idx) => `${notStrings[idx]}{string}`);
	const args = map (camelCase) (strings);
	return {remainingDescription, args};
};
const isSingleCap = s => (s.length === 1) && (s.toUpperCase() === s) && (s.toLowerCase() !== s);
const parseWords =
	reduce (
		({description = [], args = []}) => x =>
			isSingleCap (x)
				? {description: [...description, '{word}',], args: [...args, x]}
				: {description: [...description, x], args}
	) ({})

const parseArguments = s => {
	const {remainingDescription, args: stringArgs} = parseStrings (s);
	const {description, args: wordsArgs} = parseWords (chain (words) (remainingDescription));
	const {functionBody = [], args = []} =
		s.endsWith(':') ? {args: ['{rawTable}'], functionBody: [ whateverStupidShitYouUseToParseTheDatatable ]} : {};
	return {
		description: unwords (description),
		args: unwords (map (s => `${s},`) ([...stringArgs, ...wordsArgs, ...args])),
		functionBody: unwords (functionBody)
	};
};

//getSteps :: String -> Array Step
const stepDescriptionToStepObject = stepDescription => {
	const [stepType, ...rawDescription] = words (stepDescription);
	return {
		type: capitalize (stepType),
		...parseArguments (unwords (rawDescription))
	};
};
const getSteps = pipe([
	splitOn('\n'),
	map (trim),
	reject (a => a.length === 0),
	filter (firstWordIn (steps)),
	map (stepDescriptionToStepObject)
]);
const replaceStepWith = newStep => s =>
	unwords ([newStep, ...words (s).slice(1)]);

const capitalize = s => `${s[0].toUpperCase()}${s.slice(1)}`;
const lowerFirst = s => `${s[0].toLowerCase()}${s.slice(1)}`;
const camelCase = pipe([words, map (capitalize), joinWith (''), lowerFirst]);
const lastItemThatIsntIn = notAlloweds => items => {
	for (const item of reverse(items)) {
		if (notAlloweds.includes(item)) continue;
		return item;
	}
};
const lastRealStep = lastItemThatIsntIn (fakeSteps);
const turnAndsIntoWhatevers = a => {
	const types = map (prop ('type')) (a);
	const betterTypes = types.map((s, idx) =>
		elemOf(fakeSteps)(words(s)[0])
			? replaceStepWith(words(lastRealStep(types.slice(0, idx)))[0])(s)
			: s
	);
	return a.map(({type, ...rest}, idx) => ({type: betterTypes[idx], ...rest}))
};
const isOdd = x => x % 2 === 1;
const globals = [...properSteps, 'cy', 'expect'];
const turnIntoPrettyFunctions = pipe([ 
	map (({type, functionBody, args, description}) => `${type}('${description}', (${args}) => {\n${functionBody}\n});`),
	concat ([`/* globals ${globals.join(', ')} */`]),
	joinWith ('\n\n'), 
]);

const gherkinToSteps = pipe([
	preprocess,
	getSteps,
	turnAndsIntoWhatevers,
	turnIntoPrettyFunctions,
]);

const readInputFile = argv => !argv[2] ? Left ('please specify an input file')
: argv[2].endsWith('txt') ? Right (readFileSync(argv[2], 'utf8')) 
: Left ('please specify an input file');

const getFeatureName = pipe([
	splitOn ('\n'),
	reject (a => a.length === 0),
	head,
	map (splitOn (':')),
	chain (last),
	map (trim),
	map (pipe([words, map (capitalize), joinWith ('')])),
	fromMaybe ('DefaultNameXD'),
]);

const main = dir => gherkin => {
	const steps = gherkinToSteps(gherkin);
	const prettyGherkin = preprocess(gherkin);
	const stepFileName = getFeatureName (prettyGherkin);
	const stepDir = `${dir}/${stepFileName}`;
	encase (mkdirSync) (stepDir);
	appendFileSync(`${stepDir}/steps.js`, steps, 'utf8');
	appendFileSync(`${dir}/${stepFileName}.feature`, prettyGherkin, 'utf8');
	return true;
};

const outputDir = process.env.OUTDIR ? Right (process.env.OUTDIR) : Left ('please specify a directory to write to');
const input = readInputFile (process.argv);
pipe([
	lift2 (main) (outputDir),
	either (show) (K ('success')),
	console.log,
]) (input);

module.exports = {
	parseArguments,
}
