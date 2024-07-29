all: pjcall

pjcall: src/pjcall.cpp
	cc -o $@ $< `pkg-config --cflags --libs libpjproject` -lm -lssl -lcrypto -lspeex -l speexdsp -lgsm -lsrtp-x86_64-unknown-linux-gnu -lwebrtc-x86_64-unknown-linux-gnu -lresample-x86_64-unknown-linux-gnu -lilbccodec-x86_64-unknown-linux-gnu -lpjmedia-codec-x86_64-unknown-linux-gnu -lpjmedia-videodev-x86_64-unknown-linux-gnu -lpjmedia-audiodev-x86_64-unknown-linux-gnu -lpjmedia-x86_64-unknown-linux-gnu -lasound -lSDL2 -lm

run:
	./pjcall

dev:
	make pjcall run

clean:
	rm -f pjcall

.PHONY: all clean
