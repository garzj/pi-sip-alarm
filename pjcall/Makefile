all: pjcall

pjcall: src/pjcall.cpp
	cc -o $@ $< `pkg-config --cflags --libs libpjproject`

run:
	./pjcall

dev:
	make pjcall run
