
;========================================================
; unit_tests.asm
;
; Collects and executes all unit tests.
;========================================================

    include "unit_tests.inc"


; Initialization routine called before all unit tests are
; started.
    UNITTEST_INITIALIZE
    ; Do your initialization here ...
    ; ...
    ; ...
    ; For this simple example we don't need any special initialization.
    ; So we simply return.
    ; Please note: the stack pointer does not need to be setup explicitly
    ; for the unit tests.
    ret


    MODULE TestSuite_ClearScreen

; A unit testcase needs to start with "UT_" (upper case letters).
; DeZog will collect all these labels and offer them for execution.

; Tests that the screen is cleared/filled with 0's.
UT_clear_screen:
    ; Write some bytes to the screen area
    ld a,0xFF
    ld (SCREEN),a
    ld (SCREEN+SCREEN_SIZE/2),a
    ld (SCREEN+SCREEN_SIZE-1),a
    ld (SCREEN+SCREEN_SIZE),a

    ; Now clear the screen
    call clear_screen

    ; Test that all values inside the screen area are cleared
    TEST_MEMORY_BYTE SCREEN, 0
    TEST_MEMORY_BYTE SCREEN+SCREEN_SIZE/2, 0
    TEST_MEMORY_BYTE SCREEN+SCREEN_SIZE-1, 0

    TEST_MEMORY_BYTE SCREEN+SCREEN_SIZE, 0xFF
    nop
 TC_END


; Tests filling the background.
UT_fill_backg:
    ; Write some bytes to the screen area
    ld a,0xFF
    ld (COLOR_SCREEN),a
    ld (COLOR_SCREEN+COLOR_SCREEN_SIZE/2),a
    ld (COLOR_SCREEN+COLOR_SCREEN_SIZE-1),a
    ld (COLOR_SCREEN+COLOR_SCREEN_SIZE),a

    ; Now fill the background with 128
    ld a,128
    call fill_backg

    ; Test that all values inside the screen area are cleared
    TEST_MEMORY_BYTE COLOR_SCREEN, 128
    TEST_MEMORY_BYTE COLOR_SCREEN+COLOR_SCREEN_SIZE/2, 128
    TEST_MEMORY_BYTE COLOR_SCREEN+COLOR_SCREEN_SIZE-1, 128

    TEST_MEMORY_BYTE COLOR_SCREEN+COLOR_SCREEN_SIZE, 0xFF
 TC_END


; Tests clearing the background.
UT_clear_backg:
    ; Write some bytes to the screen area
    ld a,0xFF
    ld (COLOR_SCREEN),a
    ld (COLOR_SCREEN+COLOR_SCREEN_SIZE/2),a
    ld (COLOR_SCREEN+COLOR_SCREEN_SIZE-1),a
    ld (COLOR_SCREEN+COLOR_SCREEN_SIZE),a

    ; Now clear the background
    call clear_backg

    ; Test that all values inside the screen area are cleared
    TEST_MEMORY_BYTE COLOR_SCREEN, 0
    TEST_MEMORY_BYTE COLOR_SCREEN+COLOR_SCREEN_SIZE/2, 0
    TEST_MEMORY_BYTE COLOR_SCREEN+COLOR_SCREEN_SIZE-1, 0

    TEST_MEMORY_BYTE COLOR_SCREEN+COLOR_SCREEN_SIZE, 0xFF
 TC_END

    ENDMODULE



    MODULE TestSuite_Fill

; Tests filling a memory area
UT_fill_memory:
    ; Write some bytes
    ld a,0xFF
    ld (fill_memory_data-1),a
    ld (fill_memory_data),a
    ld (fill_memory_data+FILL_MEMORY_SIZE/2),a
    ld (fill_memory_data+FILL_MEMORY_SIZE-1),a
    ld (fill_memory_data+FILL_MEMORY_SIZE),a

    ; Now fill the memory area
    ld a,22
    ld hl,fill_memory_data
    ld bc,FILL_MEMORY_SIZE
    call fill_memory

    ; Test that all values inside the screen area are cleared
    TEST_MEMORY_BYTE fill_memory_data-1, 0xFF
    TEST_MEMORY_BYTE fill_memory_data, 22
    TEST_MEMORY_BYTE fill_memory_data+FILL_MEMORY_SIZE/2, 22
    TEST_MEMORY_BYTE fill_memory_data+FILL_MEMORY_SIZE-1, 22

    TEST_MEMORY_BYTE fill_memory_data+FILL_MEMORY_SIZE, 0xFF
 TC_END


FILL_MEMORY_SIZE:   equ 10
    defb 0
fill_memory_data:
    defs 10
    defb 0


; Tests filling a line in the background color screen.
UT_fill_bckg_line_normal:
    ; Initialize background
    call clear_backg

    ; Fill line with color
    ld a,MAGENTA
    ld de,COLOR_SCREEN
    call fill_bckg_line

    ; Test that line is filled
    TEST_MEMORY_BYTE COLOR_SCREEN, MAGENTA
    TEST_MEMORY_BYTE COLOR_SCREEN+16, MAGENTA
    TEST_MEMORY_BYTE COLOR_SCREEN+31, MAGENTA
    TEST_MEMORY_BYTE COLOR_SCREEN+32, 0

    ; Test that de points to the next line
    nop ; ASSERTION DE == COLOR_SCREEN+32
 TC_END

; Test wrap around.
UT_fill_bckg_line_wrap_around:
    ; Initialize background
    call clear_backg

    ; Fill line with color
    ld a,MAGENTA
    ld de,COLOR_SCREEN+23*32
    call fill_bckg_line

    ; Test that line is filled
    TEST_MEMORY_BYTE COLOR_SCREEN+23*32, MAGENTA
    TEST_MEMORY_BYTE COLOR_SCREEN+23*32+16, MAGENTA
    TEST_MEMORY_BYTE COLOR_SCREEN+23*32+31, MAGENTA
    TEST_MEMORY_BYTE COLOR_SCREEN+23*32-1, 0

    ; Test that de points to the first line (wrap around)
    nop ; ASSERTION DE == COLOR_SCREEN
 TC_END


; Test wrap around.
UT_fill_colors_ptr:
    ; Start value
    ld hl,fill_colors
    ld (fill_colors_ptr),hl

    ; Test increment
    call inc_fill_colors_ptr
    ; Test that pointer is moved to next line
    TEST_MEMORY_WORD fill_colors_ptr, fill_colors+1

    ; Test increment
    call inc_fill_colors_ptr
    ; Test that pointer is moved to next line
    TEST_MEMORY_WORD fill_colors_ptr, fill_colors+2

    ; Last value
    ld hl,fill_colors_end-1
    ld (fill_colors_ptr),hl

    ; Test increment
    call inc_fill_colors_ptr
    ; Test that pointer wraps around and points to first line
    TEST_MEMORY_WORD fill_colors_ptr, fill_colors
 TC_END

    ENDMODULE


;===========================================================================
; main.asm
;===========================================================================

    SLDOPT COMMENT WPMEM, LOGPOINT, ASSERTION

NEX:    equ 0   ;  1=Create nex file, 0=create sna file

    IF NEX == 0
        DEVICE ZXSPECTRUM128
        ;DEVICE ZXSPECTRUM48
    ELSE
        DEVICE ZXSPECTRUMNEXT
    ENDIF

    ORG 0x4000
    defs 0x6000 - $    ; move after screen area
screen_top: defb    0   ; WPMEMx


;===========================================================================
; Persistent watchpoint.
; Change WPMEMx (remove the 'x' from WPMEMx) below to activate.
; If you do so the program will hit a breakpoint when it tries to
; write to the first byte of the 3rd line.
; When program breaks in the fill_memory sub routine please hover over hl
; to see that it contains 0x5804 or COLOR_SCREEN+64.
;===========================================================================

; WPMEMx 0x5840, 1, w


;===========================================================================
; Include modules
;===========================================================================
    include "utilities.asm"
    include "fill.asm"
    include "clearscreen.asm"

    ; Normally you would assemble the unit tests in a separate target
    ; in the makefile.
    ; As this is a very short program and for simplicity the
    ; unit tests and the main program are assembled in the same binary.
    include "unit_tests.asm"


;===========================================================================
; main routine - the code execution starts here.
; Sets up the new interrupt routine, the memory
; banks and jumps to the start loop.
;===========================================================================


 defs 0x8000 - $
 ORG $8000

main:
    ; Disable interrupts
mlbl:   ld a,stack_top
mlbl2    ld sp,stack_top
mlbl3:
mlbl4

.local
m.l.l:
.m.l.l:
/*
    ; Switch ULA and membank
    ld bc,0x7FFD
    ;ld a,8  ; SCR = bank 7
    ld a,8+7  ; SCR = bank 7 and RAM = bank 7
    out (c),a

    ld a,7  ; SCR = bank 5 and RAM = bank 7
    out (c),a
*/

    ; CLS
    call clear_screen
    call clear_backg

    ; Init
lbl1:
    ld hl,fill_colors
    ld (fill_colors_ptr),hl
    ld de,COLOR_SCREEN
    defb ffh, 0xff
    DEFB ffh, 0xFF

    ; Enable interrupts
    ;im 1
    ;ei

main_loop:
    ; fill line with color
    ld hl,(fill_colors_ptr)
    ld a,(hl)
    call fill_bckg_line2

    ; break
    push de
    ld de,PAUSE_TIME
    call pause
    pop de

    ; Alternatively wait on vertical interrupt
    ;halt

    ; next line
    call inc_fill_colors_ptr

    jr main_loop


;===========================================================================
; Stack.
;===========================================================================


; Stack: this area is reserved for the stack
STACK_SIZE: equ 100    ; in words


; Reserve stack space
    defw 0  ; WPMEM, 2
stack_bottom:
    defs    STACK_SIZE*2, 0
stack_top:
    ;defw 0
    defw 0  ; WPMEM, 2



    IF NEX == 0
        SAVESNA "z80-sample-program.sna", main
    ELSE
        SAVENEX OPEN "z80-sample-program.nex", main, stack_top
        SAVENEX CORE 3, 1, 5
        SAVENEX CFG 7   ; Border color
        SAVENEX AUTO
        SAVENEX CLOSE
    ENDIF


;===========================================================================
; Writes a color to the border and waits on keypress
; of SPACE.
; Used for visual debugging.
; Changes:
;   A
;===========================================================================
	MACRO WAIT_SPACE color?
	ld a,color?
	out (BORDER),a
	; Wait on key press
.not_pressed:
	ld a,HIGH PORT_KEYB_BNMSHIFTSPACE
	in a,(LOW PORT_KEYB_BNMSHIFTSPACE)
	bit 0,a	; SPACE
	jr nz,.not_pressed
	; Wait on key release
.pressed:
	ld a,HIGH PORT_KEYB_BNMSHIFTSPACE
	in a,(LOW PORT_KEYB_BNMSHIFTSPACE)
	bit 0,a	; SPACE
	jr z,.pressed
	ENDM



