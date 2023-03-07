macho:
	nasm -f bin -o macho macho.asm && chmod +x macho && ./macho

test:
	echo "Hello World"
