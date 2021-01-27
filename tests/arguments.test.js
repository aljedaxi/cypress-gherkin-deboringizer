const {describe, test} = require("@jest/globals");
const {parseArguments} = require("../index");

describe('parseArguments', () => {
  test('single capital letter words are turned into {word}', () => {
    const withWords = 'big thing B and chungus C';
    const {args, description, functionBody} = parseArguments (withWords);
    expect(description).toEqual('big thing {word} and chungus {word}');
    expect(args).toEqual('B, C,');
    expect(functionBody).toEqual('');
  });
  test('strings are strings', () => {
    const withStrings = 'string "this big ol string"';
    const {args, description, functionBody} = parseArguments (withStrings);
    expect(description).toEqual('string {string}');
    expect(args).toEqual('thisBigOlString,');
    expect(functionBody).toEqual('');
  });
  test('tables are tabled', () => {
    const withColon = 'the following table:';
    const {args, description, functionBody} = parseArguments (withColon);
    expect(description).toEqual('the following table:');
    expect(args).toEqual('{rawTable},');
    expect(functionBody).toEqual('const testData = processRawTable(rawTable);');
  });
})