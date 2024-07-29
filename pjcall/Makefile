PKG_CONFIG_PATH := $(PKG_CONFIG_PATH):/usr/local/lib/pkgconfig:/usr/local/share/pkgconfig
export PKG_CONFIG_PATH

CC = g++
CFLAGS = -O2
LDFLAGS =

# PJSIP
CFLAGS += $(shell pkg-config --cflags libpjproject)
LDFLAGS += $(shell pkg-config --libs libpjproject)

# Link on local builds
ifneq ($(shell [ -f /usr/local/lib/pkgconfig/libpjproject.pc ] && echo 1),)
  LDFLAGS += -lssl -lcrypto -lspeex -lspeexdsp -lasound -lgsm -lsrtp-x86_64-unknown-linux-gnu -lwebrtc-x86_64-unknown-linux-gnu -lresample-x86_64-unknown-linux-gnu -lilbccodec-x86_64-unknown-linux-gnu -lpjmedia-codec-x86_64-unknown-linux-gnu -lpjmedia-videodev-x86_64-unknown-linux-gnu -lpjmedia-audiodev-x86_64-unknown-linux-gnu -lpjmedia-x86_64-unknown-linux-gnu
endif

all: pjcall

pjcall: src/pjcall.cpp
	$(CC) -o $@ $< $(CFLAGS) $(LDFLAGS)

run:
	./pjcall

dev:
	make pjcall run

clean:
	rm -f pjcall

.PHONY: all clean
