# ASM and List Files

*.asm and *.list files are very similar.
Normally the main difference is that a list has extra info of the binary assembly.
I.e. the lines begin with the address and the bytes contents, followed by a copy from the line in the asm file.

These also requires to handle them slightly different.


# Grammar

A typical list file line may look like:

~~~asm
29    0012  D3 FE       	out (0xfe),a
~~~

The corresponding line in the asm file could be:
~~~asm
   	out (0xfe),a
~~~

If the grammar of the asm file is now used for the list file a few unwanted effects could happen.

E.g. the register AF in Z80 is also a valid hex number and e.g. the following list file line
~~~asm
28    0011  AF          	xor a
~~~

would highlight AF as a register.

There fore there is a special list file grammar that first "filters" the address and binary contents before the rest is evaluated.

Anyhow some ambiguities cannot easily be resolved, e.g. DEFB in
~~~asm
0025.R1a FF FF FF      DEFB FFh FFh FFh 	; ASCII: ???
~~~

could either be a hex number or the keyword DEFB.


# References and Code Lenses

When it is about references it is also important to consider asm files and list files separately.

List files are normally created with an assembler from the asm files.
All labels that are present in the asm files are also copied to the list files.
I.e. they are duplicated.
The same for the references to the labels.

Therefore asm-code-lens tries to keep these spaces separated.
I.e. references found in asm files are shown only for labels in asm files and references found in list files are only shown for labels in list files.

~~~
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─      ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                       │                            │
│  ┌────────────────┐        │   ┌──────────────┐
   │a.asm           │  │         │a.list        │   │
│  │                │        │   │              │
   │label1:         │  │         │label1:       │   │
│  │                │        │   │              │
   │    JP label1   │  │         │    JP label1 │   │
│  │                │        │   │              │
   │                │  │         │              │   │
│  └────────────────┘        │   └──────────────┘
                       │                            │
│  ┌────────────────┐        │
   │a.asm           │  │                            │
│  │                │        │
   │                │  │                            │
│  │                │        │
   │    JP label1   │  │                            │
│  │                │        │
   │                │  │                            │
│  └────────────────┘        │
                       │                            │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
~~~


## DeZog

However there is a special case to consider: DeZog.
With DeZog a combination of asm and list files would be possible. (Not a common case but possible.):
- asm files assembled. An associated list file may exist.
- when running into an area without asm source code, e.g. ROM code, the disassembler shows a list file (disasm.list).
This list file could contain references to the asm file (this is of course quiet unlikely for ROM code).
- Furthermore a hand-crafted rev-eng.list file may exist for reverse engineering.

In this case the list file contains a reference to the asm file. I.e. both, asm and list file, have references.
However, the DeZog list file (disasm.list) will not contain the referenced label in this case. (It is filtered by DeZog.)


~~~
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                                                             │
│  ┌───────────────┐                         ┌──────────────────┐      ┌──────────────────┐
   │a.asm          │                         │rev-eng.list      │      │disasm.list       │  │
│  │               │                         │                  │      │                  │
   │label1:        │                         │                  │      │                  │  │
│  │               │                         │    JP NZ,label1  │      │    JP label1     │
   │    JP label1  │                         │                  │      │                  │  │
│  │               │                         │                  │      │                  │
   │               │                         │                  │      │                  │  │
│  └───────────────┘                         └──────────────────┘      └──────────────────┘
                                                                                             │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
~~~

~~~
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
   ┌───────────────┐ │
│  │a.list         │
   │               │ │
│  │label1:        │
   │               │ │
│  │    JP label1  │
   │               │ │
│  │               │
   └───────────────┘ │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
~~~

~~~
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                   │
│  ┌──────────────────┐      ┌──────────────────┐
   │rev-eng.list      │      │disasm.list       │  │
│  │                  │      │                  │
   │label1:           │      │                  │  │
│  │                  │      │    JP label1     │
   │    JP NZ,label1  │      │                  │  │
│  │                  │      │                  │
   │                  │      │                  │  │
│  └──────────────────┘      └──────────────────┘
                                                   │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
~~~


Therefore the following separation is done when collecting the references for a found label:
1. a label is found in either list or asm file
2. references are searched in list ad asm files
3. If reference found a check is done if label file type (asm or list) is same as reference file type
	1. IF yes THEN add reference
	2. IF not THEN
		1. IF label NOT exists in reference file type THEN add reference

