

import * as assert from 'assert';
import {setCustomCommentPrefix, stripAllComments} from '../src/comments';


suite('comments', () => {

    function verifyMultiLines(inpOutp: string[]) {
        // Split into input and output
        const inp: string[] = [];
        const outp: string[] = [];
        let isInput = true;
        for (const item of inpOutp) {
            if (isInput)
                inp.push(item);
            else
                outp.push(item);
            isInput = !isInput;
        }

        // Execute
        stripAllComments(inp);

        // Verify
        const len = inp.length;
        assert.equal(len, inpOutp.length / 2);

        for (let i = 0; i < len; i++) {
            assert.equal(inp[i], outp[i], 'Line ' + i);
        }
    }

    suite('stripAllComments', () => {

        setCustomCommentPrefix();



        test('single line comments', () => {
            const inpOutp = [
                '',	            '', // 0
                ' ',	        ' ',
                ' a',	        ' a',
                'a: b ',	    'a: b ',
                ';',	        '',
                ' ;',	        ' ',
                ' a ;b',	    ' a ',
                ' "a" ;b',	    '     ',
                '//',	        '',
                ' //',          ' ',

                ' a //b',	    ' a ',  // 10
                ' "a" //b',	    '     ',
                ' / //b',	    ' / ',
                '""',	        '  ',
                ' "abc" ',	    '       ',
                '"',	        '',    // 15
                ' "abc ',	    ' ',
                '""""',	        '    ',
                ' "abc" "xy" ',	'            ',
                '"""',          '  ',

                ' "abc" "xy ',	'       ',  // 20
                'a";"b',	    'a   b',
                ' "abc" ";x ',	'       ',
                'a"//"b',	    'a    b',
                ' "abc" "//x ', '       ',
                ' "/*"b',       '     b',
                ' */b',         ' */b'
            ];
            // Verify
            verifyMultiLines(inpOutp);
        });



        suite('multiline', () => {

            test('one or 2 liners', () => {
                const inpOutp = [
                    '/*/', '',
                    '*/', '  ',

                    '*/*', '*',
                    '*/', '  ',

                    'ab/*/', 'ab',
                    'cd/*/', '     ',

                    '/**/', '    ',

                    'a/*b*/c', 'a     c',
                ];

                // Verify
                verifyMultiLines(inpOutp);
            });

            test('several comments in one line', () => {
                const inpOutp = [
                    'd/*ee', 'd',
                    'f*//*g*/h', '        h',

                    '/**/a/*b*/', '    a     ',

                    '/**/a/*b', '    a',
                    '*/', '  ',

                    '/**/a/*b*/c', '    a     c',

                    ' /*aa*/bb/*ccc*/ddd/*ee', '       bb       ddd',
                    'f*//*gg*/h', '         h',

                    'ab/*/', 'ab',
                    'cd/*/', '     ',

                    '/**/', '    ',

                    'a/*b*/c', 'a     c',
                ];

                // Verify
                verifyMultiLines(inpOutp);
            });

            test('several lines', () => {
                const inpOutp = [
                    '/*/', '',
                    '', '',
                    'asdfgh', '',
                    '*/', '  ',

                    'ab/*/', 'ab',
                    'cd/*/', '     ',

                    '/**/', '    ',

                    'a/*b*/c', 'a     c',
                ];

                // Verify
                verifyMultiLines(inpOutp);
            });
        });

    });


    suite('setCustomCommentPrefix', () => {
        test('single char', () => {
            setCustomCommentPrefix('#');
            const inpOutp = [
                '#', '',
                ' #', ' ',
                ' a #b', ' a ',
                ' a ;b', ' a ',
                ' a //b', ' a ',
            ];
            // Verify
            verifyMultiLines(inpOutp);
        });

        test('multi char', () => {
            setCustomCommentPrefix('###');
            const inpOutp = [
                '#', '#',
                ' ##', ' ##',
                ' a ###b', ' a ',
            ];
            // Verify
            verifyMultiLines(inpOutp);
        });
    });

});
