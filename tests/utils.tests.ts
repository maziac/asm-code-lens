

import * as assert from 'assert';
import {setCustomCommentPrefix, stripComment} from '../src/utils';


suite('utils', () => {

    suite('stripComment', () => {

        setCustomCommentPrefix();

        test('No comment', () => {
            assert.equal(stripComment(''), '');
            assert.equal(stripComment(' '), ' ');
            assert.equal(stripComment(' a'), ' a');
            assert.equal(stripComment('a: b '), 'a: b ');
        });

        test('Comment', () => {
            assert.equal(stripComment(';'), '');
            assert.equal(stripComment(' ;'), ' ');
            assert.equal(stripComment(' a ;b'), ' a ');
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

    });

});
