# ASM and List Files

*.asm and *.list files are very similar.
Normally the main difference is that a list file has extra info of the binary assembly.
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

E.g. the register AF in Z80 is also a valid hex number and the following list file line
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
