import {FoldingRegexes} from '../../src/regexes/foldingregexes';
import * as assert from 'assert';



suite('FoldingRegexes', () => {

    test('regexSingleLineComments', () => {
        assert.equal(FoldingRegexes.regexSingleLineComments(undefined).source, "^(;|\\/\\/)");
        assert.equal(FoldingRegexes.regexSingleLineComments('#').source, "^(;|\\/\\/|#)");

        let r = FoldingRegexes.regexSingleLineComments(undefined);
        let m = r.exec(';=======');
        assert.notEqual(m, undefined);

        // To check that the 'g' flag is not set
        m = r.exec(';=======');
        assert.notEqual(m, undefined);

        m = r.exec('; main.asm');
        assert.notEqual(m, undefined);

        m = r.exec('//lbl');
        assert.notEqual(m, undefined);

        m = r.exec('');
        assert.equal(m, undefined);

        m = r.exec('a');
        assert.equal(m, undefined);

        m = r.exec('# main.asm');
        assert.equal(m, undefined);

        r = FoldingRegexes.regexSingleLineComments('#');
        m = r.exec(';=======');
        assert.notEqual(m, undefined);

        m = r.exec('//lbl');
        assert.notEqual(m, undefined);

        m = r.exec('#');
        assert.notEqual(m, undefined);
    });
});
