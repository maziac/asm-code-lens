

import * as assert from 'assert';
import { regexLabelColon, regexLabelWithoutColon } from '../src/regexes';
import { AssertionError } from 'assert';
//import * as path from 'path';
//const fs = require('fs-extra');


suite('RegExes', () => {

    function checkResults(regex: RegExp, inp: string, outp: string) {
        const inputs = inp.split('\n');
        const outputs = outp.split('\n');
        // Check the test
        const count = inputs.length;
        assert.equal(count, outputs.length);    // Number of lines in input and output should be equal, otherwise the test is wrong.
        for(let i=0; i<count; i++) {
            const input = inputs[i];
            const output = outputs[i];
            const result = regex.exec(input);
            if(result) {
                const found = result[1];
                assert.equal(output, found);
            }
            else 
                assert.equal(output, '');
        }
    }


    suite('regexLabelColon', () => {
 
        test('A few labels', (done) => {
            const regex = regexLabelColon();
            const inp = `
label1:
label1:  defb 0 ; comment
Label1:
label_0123456789:
l:
0l:
_l:
label.init:
label._init:
label
  label2:
   label2:defw 898; comm
   label2.loop:
`;
            const outp = 
            `
label1
Label1
label_0123456789
l

_l
label.init
label._init
label
label2
label2
label2.loop
`;
            checkResults(regex, inp, outp);
            done();
        });
    });


});