

import * as assert from 'assert';
import {setCustomCommentPrefix, stripAllComments, stripComment} from '../src/comments';


suite('comments', () => {

    suite('stripComment', () => {

        setCustomCommentPrefix();

        test('No comment', () => {
            assert.equal(stripComment(''), '');
            assert.equal(stripComment(' '), ' ');
            assert.equal(stripComment(' a'), ' a');
            assert.equal(stripComment('a: b '), 'a: b ');
        });

        test('Comment ;', () => {
            assert.equal(stripComment(';'), '');
            assert.equal(stripComment(' ;'), ' ');
            assert.equal(stripComment(' a ;b'), ' a ');
            assert.equal(stripComment(' "a" ;b'), '     ');
        });

        test('Comment //', () => {
            assert.equal(stripComment('//'), '');
            assert.equal(stripComment(' //'), ' ');
            assert.equal(stripComment(' a //b'), ' a ');
            assert.equal(stripComment(' "a" //b'), '     ');
            assert.equal(stripComment(' / //b'), ' / ');
        });


        test('1 quote', () => {
            assert.equal(stripComment('""'), '  ');
            assert.equal(stripComment(' "abc" '), '       ');
        });

        test('open quote', () => {
            assert.equal(stripComment('"'), ' ');
            assert.equal(stripComment(' "abc '), '      ');
        });

        test('2 quotes', () => {
            assert.equal(stripComment('""""'), '    ');
            assert.equal(stripComment(' "abc" "xy" '), '            ');
        });

        test('1 quote plus 1 open quote', () => {
            assert.equal(stripComment('"""'), '   ');
            assert.equal(stripComment(' "abc" "xy '), '           ');
        });

        test('; inside quote', () => {
            assert.equal(stripComment('a";"b'), 'a   b');
            assert.equal(stripComment(' "abc" ";x '), '           ');
        });

        test('// inside quote', () => {
            assert.equal(stripComment('a"//"b'), 'a    b');
            assert.equal(stripComment(' "abc" "//x '), '            ');
        });

    });



    suite('stripAllComments', () => {

        setCustomCommentPrefix();

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

        test('single line comments', () => {
            const inpOutp = [
                '',	            '',
                ' ',	        ' ',
                ' a',	        ' a',
                'a: b ',	    'a: b ',
                ';',	        '',
                ' ;',	        ' ',
                ' a ;b',	    ' a ',
                ' "a" ;b',	    '     ',
                '//',	        '',
                ' //',	        ' ',
                ' a //b',	    ' a ',
                ' "a" //b',	    '     ',
                ' / //b',	    ' / ',
                '""',	        '  ',
                ' "abc" ',	    '       ',
                '"',	        ' ',
                ' "abc ',	    '      ',
                '""""',	        '    ',
                ' "abc" "xy" ',	'            ',
                '"""',	        '   ',
                ' "abc" "xy ',	'           ',
                'a";"b',	    'a   b',
                ' "abc" ";x ',	'           ',
                'a"//"b',	    'a    b',
                ' "abc" "//x ',	'            ',
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

});
