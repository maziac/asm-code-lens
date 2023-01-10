import {FoldingRegexes} from '../../src/regexes/foldingregexes';
import * as assert from 'assert';



suite('FoldingRegexes', () => {

    test('regexSingleLineComments', () => {
        assert.equal(FoldingRegexes.regexCommentSingleLine(undefined).source, "^(;|\\/\\/)");
        assert.equal(FoldingRegexes.regexCommentSingleLine('#').source, "^(;|\\/\\/|#)");

        let r = FoldingRegexes.regexCommentSingleLine(undefined);
        let m = r.exec(';=======');
        assert.notEqual(m, undefined);

        // To check that the 'g' flag is not set
        m = r.exec(';=======');
        assert.notEqual(m, undefined);

        m = r.exec('; main.asm');
        assert.notEqual(m, undefined);
        m = r.exec(' ; main.asm');
        assert.equal(m, undefined);

        m = r.exec('//lbl');
        assert.notEqual(m, undefined);
        m = r.exec(' //lbl');
        assert.equal(m, undefined);

        m = r.exec('');
        assert.equal(m, undefined);

        m = r.exec('a');
        assert.equal(m, undefined);

        m = r.exec('# main.asm');
        assert.equal(m, undefined);

        r = FoldingRegexes.regexCommentSingleLine('#');
        m = r.exec(';=======');
        assert.notEqual(m, undefined);

        m = r.exec('//lbl');
        assert.notEqual(m, undefined);

        m = r.exec('#');
        assert.notEqual(m, undefined);
    });


    test('regexCommentMultipleStart', () => {
        const r = FoldingRegexes.regexCommentMultipleStart();

        let m = r.exec('/*=======');
        assert.notEqual(m, undefined);
        m = r.exec(' /*=======');
        assert.equal(m, undefined);
        m = r.exec('');
        assert.equal(m, undefined);
        m = r.exec(';=======');
        assert.equal(m, undefined);
    });

    test('regexCommentMultipleEnd', () => {
        const r = FoldingRegexes.regexCommentMultipleEnd();

        let m = r.exec('*/');
        assert.notEqual(m, undefined);
        m = r.exec('_*/');
        assert.notEqual(m, undefined);
        m = r.exec('___*/___');
        assert.notEqual(m, undefined);

        m = r.exec(' /*=======');
        assert.equal(m, undefined);
    });


    test('regexModuleStart', () => {
        const r = FoldingRegexes.regexModuleStart();

        let m = r.exec(' MODULE');
        assert.notEqual(m, undefined);
        m = r.exec(' module');
        assert.notEqual(m, undefined);
        m = r.exec(' module ');
        assert.notEqual(m, undefined);
        m = r.exec('lbl: module');
        assert.notEqual(m, undefined);
        m = r.exec('module');
        assert.equal(m, undefined);
        m = r.exec(' modulec');
        assert.equal(m, undefined);
    });

    test('regexModuleEnd', () => {
        const r = FoldingRegexes.regexModuleEnd();

        let m = r.exec(' ENDMODULE');
        assert.notEqual(m, undefined);
        m = r.exec(' endmodule');
        assert.notEqual(m, undefined);
        m = r.exec(' endmodule ');
        assert.notEqual(m, undefined);
        m = r.exec('lbl: endmodule');
        assert.notEqual(m, undefined);
        m = r.exec('endmodule');
        assert.equal(m, undefined);
        m = r.exec('  aendmodule');
        assert.equal(m, undefined);
    });


    test('regexStructStart', () => {
        const r = FoldingRegexes.regexStructStart();

        let m = r.exec(' STRUCT');
        assert.notEqual(m, undefined);
        m = r.exec(' struct');
        assert.notEqual(m, undefined);
        m = r.exec(' struct ');
        assert.notEqual(m, undefined);
        m = r.exec('lbl: struct');
        assert.notEqual(m, undefined);
        m = r.exec('struct');
        assert.equal(m, undefined);
        m = r.exec(' structaaa');
        assert.equal(m, undefined);
    });

    test('regexStructEnd', () => {
        const r = FoldingRegexes.regexStructEnd();

        let m = r.exec(' ENDS');
        assert.notEqual(m, undefined);
        m = r.exec(' ends');
        assert.notEqual(m, undefined);
        m = r.exec(' ends ');
        assert.notEqual(m, undefined);
        m = r.exec('lbl: ends');
        assert.notEqual(m, undefined);
        m = r.exec('ends');
        assert.equal(m, undefined);
        m = r.exec(' endsb');
        assert.equal(m, undefined);
    });


    test('regexMacroStart', () => {
        const r = FoldingRegexes.regexMacroStart();

        let m = r.exec(' MACRO');
        assert.notEqual(m, undefined);
        m = r.exec(' macro');
        assert.notEqual(m, undefined);
        m = r.exec(' macro ');
        assert.notEqual(m, undefined);
        m = r.exec('lbl: macro');
        assert.notEqual(m, undefined);
        m = r.exec('macro');
        assert.equal(m, undefined);
        m = r.exec(' macroa');
        assert.equal(m, undefined);
    });

    test('regexMacroEnd', () => {
        const r = FoldingRegexes.regexMacroEnd();

        let m = r.exec(' ENDM');
        assert.notEqual(m, undefined);
        m = r.exec(' endm');
        assert.notEqual(m, undefined);
        m = r.exec(' endm ');
        assert.notEqual(m, undefined);
        m = r.exec('lbl: endm');
        assert.notEqual(m, undefined);
        m = r.exec('endm');
        assert.equal(m, undefined);
        m = r.exec(' endmb');
        assert.equal(m, undefined);
    });

});
