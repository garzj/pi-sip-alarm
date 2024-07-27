# pjcall

This part of the pi-sip-alarm project is a c wrapper of the pjsua api, providing easy control for sip registration and calls over a stdio interface.

## Build and start

- Download and install [pjsua](https://www.pjsip.org/)
  - On Fedora:
    - `sudo dnf groupinstall "Development Tools" "Development Libraries"`
    - `sudo dnf install gcc-c++ SDL2-devel libv4l gsm-devel speex-devel speexdsp-devel`
    - `git clone https://github.com/pjsip/pjproject.git`
    - `cd pjproject`
    - `./configure && make dep && make clean`
    - `make && sudo make install`
- Build this app with `make`
- Start it with `./pjcall`

## Spec

### App

- `APP_EXITING`
- `APP_EXIT`
- `APP_ERR <err_code> <...err_title>`

### Common

- `CMD_ERR_UNKNOWN_COMMAND`
- `CMD_ERR_ARG_COUNT <count> <min> [<max>]`
- `CMD_ERR_ARG_TYPE <index>`

### Registration

- Command: `r[egister] <proxy> <user> <password>`
- `REG_STATE_REGISTERING`
- `REG_ERR <pjsua_status>`
- `REG_STATE_REGISTERED`
- `REG_STATE_UNREGISTERING`
- `REG_STATE_UNREGISTERED`

## Call

- Command: `c[all] <proxy> <user> <audio_file> [<play_times>]`
- Command: `h[angup] <call_id>`
- `CALL_ERR_UNREGISTERED`
- `CALL_ERR <pjsua_status>`
- `CALL_STATE_CALLING <call_id>`
- `CALL_STATE_CONFIRMED <call_id>`
- `CALL_STATE_HANGUP <call_id>`
- `CALL_STATE_DECLINED <call_id>`
- `CALL_ERR_AUDIO <call_id> <pjsua_status>`
