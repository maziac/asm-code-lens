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


    // TODO: Tests
});
