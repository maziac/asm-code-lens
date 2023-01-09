import * as assert from 'assert';
import {getLabelAndModuleLabelFromFileInfo, getModuleFileInfo} from '../src/grepextra';
import {CommonRegexes} from '../src/regexes/commonregexes';


suite('grepextra', () => {

    test('getFileinfo', () => {
        const file = `

    MODULE mod_a

    STRUCT struct_a

    ENDS

    MODULE inner_mod_b

    ENDMODULE

    ENDMODULE
`;
        const lines = file.split('\n');
        const fileInfo = getModuleFileInfo(lines);

        assert.deepEqual(fileInfo[0], {row: 2, label: 'mod_a'});
        assert.deepEqual(fileInfo[1], {row: 4, label: 'mod_a.struct_a'});
        assert.deepEqual(fileInfo[2], {row: 6, label: 'mod_a'});
        assert.deepEqual(fileInfo[3], {row: 8, label: 'mod_a.inner_mod_b'});
        assert.deepEqual(fileInfo[4], {row: 10, label: 'mod_a'});
        assert.deepEqual(fileInfo[5], {row: 12, label: ''});
        assert.equal(fileInfo.length, 6);
    });


    test('getLabelAndModuleLabelFromFileInfo', () => {
        const file = `
label1:
    MODULE mod_a
label2:
    STRUCT struct_a
label3:
    ENDS
label4:
    MODULE inner_mod_b
label5:
    ld a,label10
.loc_label:
    ENDMODULE
label6:
    ENDMODULE
label7:
`;
        const lines = file.split('\n');
        const modStructInfos = getModuleFileInfo(lines);
        const fileInfo = {
            lines,
            modStructInfos
        };

        const regexLbls = CommonRegexes.regexLabel({labelsWithColons: true, labelsWithoutColons: false}, "asm-collection");
        const regexEnd = /[\w\.]/;

        let mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 1, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'label1', moduleLabel: 'label1'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 3, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'mod_a.label2', moduleLabel: 'mod_a.label2'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 5, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'mod_a.struct_a.label3', moduleLabel: 'mod_a.struct_a.label3'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 7, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'mod_a.label4', moduleLabel: 'mod_a.label4'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 9, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'mod_a.inner_mod_b.label5', moduleLabel: 'mod_a.inner_mod_b.label5'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 10, 9, regexEnd);
        assert.deepEqual(mLabel, {label: 'label10', moduleLabel: 'mod_a.inner_mod_b.label10'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 11, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'mod_a.inner_mod_b.label5.loc_label', moduleLabel: 'mod_a.inner_mod_b.label5.loc_label'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 13, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'mod_a.label6', moduleLabel: 'mod_a.label6'});

        mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, 15, 0, regexEnd);
        assert.deepEqual(mLabel, {label: 'label7', moduleLabel: 'label7'});
    });
});
