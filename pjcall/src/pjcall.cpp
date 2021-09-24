// Pjsua config
#define PJ_IS_LITTLE_ENDIAN 1
#define PJ_IS_BIG_ENDIAN 0
#define PJSUA_LOG_LEVEL 3

// Includes
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <stdexcept>
#include <signal.h>
#include <pjsua-lib/pjsua.h>

using namespace std;

// Pjsua account
pjsua_acc_id acc_id = PJSUA_INVALID_ID;

// Pjsua calls
struct pjsua_call
{
	string audio_file;
	int audio_play_times;
	int audio_played;
	pjsua_call_id call_id;
	pjsua_player_id play_id;
	pjmedia_port *play_port;
	int state;
};

#define CALL_STATE_CALLING 0
#define CALL_STATE_CONFIRMED 1
#define CALL_STATE_ENDED 2

vector<pjsua_call> calls;

bool get_call(pjsua_call_id, pjsua_call *&);
bool get_call(pjmedia_port *, pjsua_call *&);

// Prototype utilities
vector<string> str_split(const string &);

// Prototype app controls
void signal_handler(int);
void app_exit(int);
void error_exit(const char *, pj_status_t);

// Prototype PJSUA callbacks
void on_reg_state(pjsua_acc_id);
void on_call_state(pjsua_call_id, pjsip_event *);
void on_incoming_call(pjsua_acc_id, pjsua_call_id, pjsip_rx_data *);
void on_call_media_state(pjsua_call_id);
void on_media_finished(pjmedia_port *, void *);

// Prototype helpers
void pjsua_setup();
void sip_register(string proxy, string user, string password);
void sip_unregister();
void make_call(string proxy, string number, string audio_file, int audio_play_times = 1);
void destroy_call(pjsua_call *);
void play_audio(pjsua_call *);
void destroy_player(pjsua_call *);

int main()
{
	// Register Ctrl + C
	signal(SIGINT, signal_handler);
	signal(SIGKILL, signal_handler);

	// Setup pjsua
	pjsua_setup();

	// Input loop
	for (string line; getline(cin, line);)
	{
		if (line == "")
			continue;

		vector<string> args = str_split(line);
		string cmd = args[0];
		args.erase(args.begin());
		int arg_len = args.size();

		if (cmd == "q" || cmd == "quit")
		{
			// Exit app
			app_exit(0);
			break;
		}
		else if (cmd == "r" || cmd == "register")
		{
			// Register
			if (arg_len != 3)
			{
				cout << "CMD_ERR_ARG_COUNT " << arg_len << " 3" << endl;
				continue;
			}

			sip_register(args.at(0), args.at(1), args.at(2));
		}
		else if (cmd == "c" || cmd == "call")
		{
			// Call
			if (arg_len != 3 && arg_len != 4)
			{
				cout << "CMD_ERR_ARG_COUNT " << arg_len << " 3 4" << endl;
				continue;
			}

			int audio_play_times;
			if (arg_len == 4)
			{
				try
				{
					audio_play_times = stoi(args.at(3));
				}
				catch (invalid_argument)
				{
					cout << "CMD_ERR_ARG_TYPE 3" << endl;
					continue;
				}
			}

			make_call(args.at(0), args.at(1), args.at(2), audio_play_times);
		}
		else if (cmd == "h" || cmd == "hangup")
		{
			// Hangup call
			if (arg_len != 1)
			{
				cout << "CMD_ERR_ARG_COUNT " << arg_len << " 1" << endl;
				continue;
			}

			int call_id;
			try
			{
				call_id = stoi(args.at(0));
			}
			catch (invalid_argument)
			{
				cout << "CMD_ERR_ARG_TYPE 0" << endl;
				continue;
			}

			// Hangup call
			pjsua_call_hangup(call_id, 200, NULL, NULL);
		}
		else
		{
			cout << "CMD_ERR_UNKNOWN_COMMAND" << endl;
		}
	}

	return 0;
}

// UTILITY:

vector<string> str_split(const string &str)
{
	vector<string> res;
	istringstream iss(str);
	for (string s; iss >> s;)
		res.push_back(s);
	return res;
}

// CALLS:

bool get_call(pjsua_call_id call_id, pjsua_call *&ret_call)
{
	for (pjsua_call &call : calls)
	{
		if (call.call_id == call_id)
		{
			ret_call = &call;
			return true;
		}
	}

	return false;
}

bool get_call(pjmedia_port *play_port, pjsua_call *&ret_call)
{
	for (pjsua_call &call : calls)
	{
		if (call.play_port == play_port)
		{
			ret_call = &call;
			return true;
		}
	}
	return false;
}

void make_call(string proxy, string number, string audio_file, int audio_play_times)
{
	pj_status_t status;

	// Sip call uri
	char call_uri_str[256];
	sprintf(call_uri_str, "sip:%s@%s", number.c_str(), proxy.c_str());
	pj_str_t call_uri = pj_str(call_uri_str);

	// Check registration
	if (acc_id == PJSUA_INVALID_ID)
	{
		cout << "CALL_ERR_UNREGISTERED" << endl;
		return;
	}

	// Make new call
	pjsua_call_id call_id;
	status = pjsua_call_make_call(acc_id, &call_uri, NULL, NULL, NULL, &call_id);
	if (status != PJ_SUCCESS)
	{
		cout << "CALL_ERR " << status << endl;
		return;
	}

	// Provide audio file to call
	pjsua_call *call;
	if (!get_call(call_id, call))
	{
		error_exit("Could not get a call by id.", 1);
	}
	call->audio_file = audio_file;
	call->audio_play_times = audio_play_times;
	call->audio_played = 0;

	cout << "CALL_STATE_CALLING " << call->call_id << endl;
}

void on_call_state(pjsua_call_id call_id, pjsip_event *e)
{
	PJ_UNUSED_ARG(e);

	pj_status_t status;

	// Get call info
	pjsua_call_info ci;
	status = pjsua_call_get_info(call_id, &ci);
	if (status != PJ_SUCCESS)
		error_exit("Coult not get account info.", status);

	pjsua_call *call;
	if (!get_call(call_id, call))
	{
		// This is a new call -> add to list
		calls.push_back(pjsua_call());
		call = &calls.back();
		call->call_id = call_id;
		call->play_id = PJSUA_INVALID_ID;
		call->state = CALL_STATE_CALLING;
	}

	// cout << "CALL_STATE " << call->call_id << " " << ci.state << endl;

	// Check call state
	if (ci.state == PJSIP_INV_STATE_CONFIRMED)
	{
		cout << "CALL_STATE_CONFIRMED " << call->call_id << endl;
		call->state = CALL_STATE_CONFIRMED;

		// Ensure that message is played from start
		play_audio(call);
	}
	else if (ci.state == PJSIP_INV_STATE_DISCONNECTED)
	{
		if (call->state == CALL_STATE_CONFIRMED)
			cout << "CALL_STATE_HANGUP " << call->call_id << endl;
		else
			cout << "CALL_STATE_DECLINED " << call->call_id << endl;

		call->state = CALL_STATE_ENDED;

		// Destroy call
		destroy_call(call);
	}
}

void on_incoming_call(pjsua_acc_id account_id, pjsua_call_id call_id, pjsip_rx_data *rdata)
{
	PJ_UNUSED_ARG(account_id);
	PJ_UNUSED_ARG(call_id);
	PJ_UNUSED_ARG(rdata);

	// cout << "CALL_INC" << endl;

	// Answer incoming calls with 486 Busy
	pjsua_call_answer(call_id, 486, NULL, NULL);
}

void destroy_call(pjsua_call *call)
{
	// Destroy media player
	destroy_player(call);

	// Drop call from list
	for (int i = calls.size() - 1; i >= 0; i--)
	{
		if (calls.at(i).call_id == call->call_id)
		{
			calls.erase(calls.begin() + i);
		}
	}
}

// MEDIA PLAYER:

void on_call_media_state(pjsua_call_id call_id)
{
	// Get call info
	pjsua_call_info ci;
	pjsua_call_get_info(call_id, &ci);

	pjsua_call *call;
	if (!get_call(call_id, call))
	{
		error_exit("Could not get a call by id.", 1);
	}

	// Check if call is active
	if (ci.media_status == PJSUA_CALL_MEDIA_ACTIVE)
	{
		// Play audio file
		play_audio(call);
	}
}

void play_audio(pjsua_call *call)
{
	pj_str_t name;
	pj_status_t status;

	if (call->play_id != PJSUA_INVALID_ID)
	{
		// Already playing, restart player...
		pjmedia_wav_player_port_set_pos(call->play_port, 0);
		return;
	}

	// Get call info
	pjsua_call_info ci;
	pjsua_call_get_info(call->call_id, &ci);

	// Create player
	status = pjsua_player_create(pj_cstr(&name, call->audio_file.c_str()), PJMEDIA_FILE_NO_LOOP, &call->play_id);
	if (status != PJ_SUCCESS)
	{
		cout << "CALL_ERR_AUDIO " << call->call_id << " " << status << endl;
		return;
	}

	// Connect call to player
	pjsua_conf_connect(pjsua_player_get_conf_port(call->play_id), ci.conf_slot);

	// Get play_port from play_id
	status = pjsua_player_get_port(call->play_id, &call->play_port);
	if (status != PJ_SUCCESS)
	{
		cout << "CALL_ERR_AUDIO " << call->call_id << " " << status << endl;
		return;
	}

	// Register media finished callback
	status = pjmedia_wav_player_set_eof_cb2(call->play_port, NULL, &on_media_finished);
	if (status != PJ_SUCCESS)
	{
		cout << "CALL_ERR_AUDIO " << call->call_id << " " << status << endl;
		return;
	}
}

void on_media_finished(pjmedia_port *play_port, void *user_data)
{
	PJ_UNUSED_ARG(play_port);
	PJ_UNUSED_ARG(user_data);

	pjsua_call *call;
	if (!get_call(play_port, call))
		error_exit("Could not get a call by play port.", 1);

	call->audio_played++;
	if (call->audio_played < call->audio_play_times || (call->audio_play_times == 0 && call->audio_played < 10))
	{
		// Repeat audio
		play_audio(call);
	}
	else if (call->state == CALL_STATE_CONFIRMED)
	{
		// Hangup call
		pjsua_call_hangup(call->call_id, 200, NULL, NULL);
	}
}

void destroy_player(pjsua_call *call)
{
	if (call->play_id != PJSUA_INVALID_ID)
	{
		pjsua_player_destroy(call->play_id);
		call->play_id = PJSUA_INVALID_ID;
	}
}

// SIP:

void sip_register(string proxy, string user, string password)
{
	pj_status_t status;

	sip_unregister();

	cout << "REG_STATE_REGISTERING" << endl;

	// Account config
	pjsua_acc_config cfg;
	pjsua_acc_config_default(&cfg);

	// Sip user uri
	char user_uri_str[256];
	sprintf(user_uri_str, "sip:%s@%s", user.c_str(), proxy.c_str());
	pj_str_t user_uri = pj_str(user_uri_str);

	// Create and define account
	cfg.reg_timeout = PJSUA_REG_INTERVAL;
	cfg.id = user_uri;
	cfg.reg_uri = user_uri;
	cfg.cred_count = 1;
	cfg.cred_info[0].realm = pj_str((char *)proxy.c_str());
	cfg.cred_info[0].scheme = pj_str((char *)"digest");
	cfg.cred_info[0].username = pj_str((char *)user.c_str());
	cfg.cred_info[0].data_type = PJSIP_CRED_DATA_PLAIN_PASSWD;
	cfg.cred_info[0].data = pj_str((char *)password.c_str());

	// Add account
	status = pjsua_acc_add(&cfg, PJ_TRUE, &acc_id);
	if (status != PJ_SUCCESS)
	{
		cout << "REG_ERR " << status << endl;
		return;
	}
}

void on_reg_state(pjsua_acc_id acc_id)
{
	pj_status_t status;

	pjsua_acc_info acc_info;
	status = pjsua_acc_get_info(acc_id, &acc_info);
	if (status != PJ_SUCCESS)
		error_exit("Coult not get account info.", status);

	if (acc_info.status == 200)
	{
		cout << "REG_STATE_REGISTERED" << endl;
	}
	else
	{
		cout << "REG_ERR " << acc_info.status << endl;
	}
}

void sip_unregister()
{
	pj_status_t status;

	// Logout if already registered
	if (acc_id != PJSUA_INVALID_ID)
	{
		cout << "REG_STATE_UNREGISTERING" << endl;

		status = pjsua_acc_del(acc_id);
		if (status != PJ_SUCCESS)
		{
			cout << "REG_ERR " << status << endl;
		}
		else
		{
			acc_id = PJSUA_INVALID_ID;
			cout << "REG_STATE_UNREGISTERED" << endl;
		}
	}
}

// PJSUA:

void pjsua_setup()
{
	pj_status_t status;

	// Create pjsua
	status = pjsua_create();
	if (status != PJ_SUCCESS)
		error_exit("Error in pjsua_create()", status);

	// Configure pjsua
	pjsua_config cfg;
	pjsua_config_default(&cfg);

	// Max calls
	cfg.max_calls = 100;

	// Callbacks
	cfg.cb.on_reg_state = &on_reg_state;
	cfg.cb.on_incoming_call = &on_incoming_call;
	cfg.cb.on_call_media_state = &on_call_media_state;
	cfg.cb.on_call_state = &on_call_state;

	// Logging
	pjsua_logging_config log_cfg;
	pjsua_logging_config_default(&log_cfg);
	// log_cfg.log_filename = pj_str((char *) "/tmp/pjsua.log");
	log_cfg.console_level = PJSUA_LOG_LEVEL;

	// Media
	pjsua_media_config media_cfg;
	pjsua_media_config_default(&media_cfg);
	media_cfg.snd_play_latency = 100;
	media_cfg.clock_rate = 8000;
	media_cfg.snd_clock_rate = 8000;
	media_cfg.quality = 10;

	// Init
	status = pjsua_init(&cfg, &log_cfg, &media_cfg);
	if (status != PJ_SUCCESS)
		error_exit("Error in pjsua_init()", status);

	// UDP Transport
	pjsua_transport_config udpcfg;
	pjsua_transport_config_default(&udpcfg);
	// udpcfg.port = 5060;
	status = pjsua_transport_create(PJSIP_TRANSPORT_UDP, &udpcfg, NULL);
	if (status != PJ_SUCCESS)
		error_exit("Error creating UDP transport", status);

	// TCP Transport
	pjsua_transport_config tcpcfg;
	pj_memcpy(&tcpcfg, &udpcfg, sizeof(tcpcfg)); // Copy from udp
	status = pjsua_transport_create(PJSIP_TRANSPORT_TCP, &tcpcfg, NULL);
	if (status != PJ_SUCCESS)
		error_exit("Error creating TCP transport", status);

	// Start pjsua
	status = pjsua_start();
	if (status != PJ_SUCCESS)
		error_exit("Error starting pjsua", status);

	// Disable sound
	status = pjsua_set_null_snd_dev();
	if (status != PJ_SUCCESS)
		error_exit("Error disabling audio", status);
}

// APP CONTROLS:

bool app_exiting = false;

void signal_handler(int signal)
{
	app_exit(0);
}

void app_exit(int code)
{
	if (!app_exiting)
	{
		app_exiting = true;
		cout << "APP_EXITING" << endl;

		pjsua_call_hangup_all();

		sip_unregister();

		pjsua_destroy();

		cout << "APP_EXIT" << endl;
		exit(code);
	}
}

void error_exit(const char *title, pj_status_t status)
{
	if (!app_exiting)
	{
		cout << "APP_ERR " << status << " " << title << endl;

		app_exit(1);
	}
}
