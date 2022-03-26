

import * as assert from 'assert';
import {readCommentsForLine, setCustomCommentPrefix, stripAllComments} from '../src/comments';


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
                ' a ;b',        ' a ',
                ' "a" ;b',      '     ',
                " 'a' ;b",      '     ',
                " '\"' '\"'",   '        ',
                ' "\'" "\'"',   '        ',
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
                    'abcdef', '',
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


    suite('readCommentsForLine', () => {
        setCustomCommentPrefix();

        test('edge cases', () => {
            let result = readCommentsForLine([], 0);
            assert.equal(result.length, 0);
            result = readCommentsForLine([' '], 0);
            assert.equal(result.length, 0);
            result = readCommentsForLine([' '], 1);
            assert.equal(result.length, 0);
            result = readCommentsForLine([' '], -1);
            assert.equal(result.length, 0);
        });

        test('equ', () => {
            let result = readCommentsForLine(['label:  EQU 10 '], 0);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'label:  EQU 10 ');

            result = readCommentsForLine([
                '   ',
                'label:  EQU 10 ',
            ], 1);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'label:  EQU 10 ');

            result = readCommentsForLine([
                '   ',
                ' ; Bla ',
                'label:  EQU 10 ',
            ], 2);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla ');
            assert.equal(result[1], 'label:  EQU 10 ');

            result = readCommentsForLine([
                '   ',
                ' ; Bla1 ',
                ' ; Bla2 ',
                'label:  EQU 10 ',
            ], 3);
            assert.equal(result.length, 3);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');
            assert.equal(result[2], 'label:  EQU 10 ');
        });


        test('label ; ...', () => {
            let result = readCommentsForLine(['label: ; some text '], 0);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'label: ; some text ');

            result = readCommentsForLine(['label: // some text '], 0);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'label: // some text ');

            result = readCommentsForLine(['label:  '], 0);
            assert.equal(result.length, 0);

            result = readCommentsForLine([
                '   ',
                'label: ; some text ',
            ], 1);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'label: ; some text ');

            result = readCommentsForLine([
                '   ',
                ' ; Bla ',
                'label: ; some text ',
            ], 2);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla ');
            assert.equal(result[1], 'label: ; some text ');

            result = readCommentsForLine([
                '   ',
                ' ; Bla1 ',
                ' ; Bla2 ',
                'label: ; some text ',
            ], 3);
            assert.equal(result.length, 3);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');
            assert.equal(result[2], 'label: ; some text ');
        });


        test('before label', () => {
            let result = readCommentsForLine([
                ' ; Bla1 ',
                ' ; Bla2 ',
                'label: ',
            ], 2);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');

            result = readCommentsForLine([
                '  ',
                ' ; Bla1 ',
                'label: ',
            ], 2);
            assert.equal(result.length, 1);
            assert.equal(result[0], ' Bla1 ');

            result = readCommentsForLine([
                '  ',
                '; Bla1 ',
                'label: ',
            ], 2);
            assert.equal(result.length, 1);
            assert.equal(result[0], ' Bla1 ');

            result = readCommentsForLine([
                ' ; Bla1 ',
                ' ; Bla2 ',
                '',
                'label: ',
            ], 3);
            assert.equal(result.length, 0);

            result = readCommentsForLine([
                ' ; Bla1 ',
                ' ; Bla2 ',
                '   ',
                'label: ',
            ], 3);
            assert.equal(result.length, 0);
        });

        test('multiline comment before label', () => {
            let result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                ' Bla2 ',
                '*/',
                'label: ',
            ], 4);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');

            result = readCommentsForLine([
                ' Bla1 ',
                ' Bla2 ',
                '*/',
                'label: ',
            ], 3);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');

            result = readCommentsForLine([
                'abcd:',
                '/*',
                ' Bla1 ',
                ' Bla2 ',
                '*/',
                'label: ',
            ], 5);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');

            result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                '*/',
                'label: ',
            ], 3);
            assert.equal(result.length, 1);
            assert.equal(result[0], ' Bla1 ');

            result = readCommentsForLine([
                '',
                '/*',
                '*/',
                'label: ',
            ], 3);
            assert.equal(result.length, 0);

            result = readCommentsForLine([
                '',
                '/*',
                ' Bla1',
                '*/Bla2',
                'label: ',
            ], 4);
            assert.equal(result.length, 1);
            assert.equal(result[0], ' Bla1');

            result = readCommentsForLine([
                '',
                '/*Bla1 ',
                ' Bla2 ',
                ' Bla3*/Bla4 ',
                'label: ',
            ], 4);
            assert.equal(result.length, 3);
            assert.equal(result[0], 'Bla1');
            assert.equal(result[1], ' Bla2 ');
            assert.equal(result[2], ' Bla3');
        });

        test('mixed', () => {
            let result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                ' Bla2 ',
                ';*/',
                'label: ',
            ], 4);
            assert.equal(result.length, 1);
            assert.equal(result[0], '*/');

            result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                ' Bla2 ',
                'Bla3*/;kl',
                'label: ',
            ], 4);
            assert.equal(result.length, 3);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' Bla2 ');
            assert.equal(result[2], 'Bla3');

            result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                ' ;Bla2 ',
                '*/',
                'label: ',
            ], 4);
            assert.equal(result.length, 2);
            assert.equal(result[0], ' Bla1 ');
            assert.equal(result[1], ' ;Bla2 ');


            // Note: this is actual wrong behavior:
            // But it would be too complicated to do it right and
            // it is only an edge case.
            result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                '/*',
                ' Bla2 ',
                '*/',
                'label: ',
            ], 5);
            assert.equal(result.length, 1);
            assert.equal(result[0], ' Bla2 ');

            // Note: this is actual wrong behavior:
            // But it would be too complicated to do it right and
            // it is only an edge case.
            result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                '//*Bla2 ',
                '*/',
                'label: ',
            ], 4);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'Bla2');

            // Note: this is actual wrong behavior:
            // But it would be too complicated to do it right and
            // it is only an edge case.
            result = readCommentsForLine([
                '/*',
                ' Bla1 ',
                '; /*Bla2 ',
                '*/',
                'label: ',
            ], 4);
            assert.equal(result.length, 1);
            assert.equal(result[0], 'Bla2');
        });

    });

});
