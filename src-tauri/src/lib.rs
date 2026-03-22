use std::sync::Mutex;
use steamworks::{Client, LobbyType, SteamId, P2PSessionRequest, P2PSessionConnectFail, GameLobbyJoinRequested};
use tauri::{AppHandle, Emitter, State};
use serde::{Deserialize, Serialize};
use discord_rich_presence::{DiscordIpc, DiscordIpcClient, activity};
use reqwest::Client as HttpClient;

struct SteamState {
    client: Mutex<Option<Client>>,
}

struct DiscordState {
    client: Mutex<Option<DiscordIpcClient>>,
}

struct HttpState {
    client: HttpClient,
}

#[derive(Clone, Serialize, Deserialize)]
struct P2PPayload {
    sender_id: String,
    msg_type: String,
    data: String,
}

#[derive(Deserialize)]
struct DiscordPresence {
    state: String,
    details: String,
    large_image: String,
    small_image: String,
    large_text: String,
    end_time: Option<i64>,
}

#[tauri::command]
fn get_steam_name(state: State<'_, SteamState>) -> Result<String, String> {
    let client_guard = state.client.lock().unwrap();
    if let Some(client) = client_guard.as_ref() {
        Ok(client.friends().name())
    } else {
        Err("Steam not initialized".to_string())
    }
}

#[tauri::command]
fn create_lobby(state: State<'_, SteamState>, app: AppHandle) -> Result<(), String> {
    let client_guard = state.client.lock().unwrap();
    if let Some(client) = client_guard.as_ref() {
        let app_handle = app.clone();
        // Allow up to 2 players, Friends Only
        client.matchmaking().create_lobby(LobbyType::FriendsOnly, 2, move |result| {
            match result {
                Ok(lobby_id) => {
                    println!("Steam Lobby Created: {:?}", lobby_id);
                    // Broadcast the native Steam Lobby ID back to the React UI
                    match app_handle.emit("lobby-created", lobby_id.raw().to_string()) {
                        Ok(_) => {},
                        Err(e) => println!("Failed to emit lobby-created event to React: {}", e),
                    }
                },
                Err(e) => println!("Failed to create Steam Lobby: {:?}", e),
            }
        });
        Ok(())
    } else {
        Err("Steam API not initialized or missing AppID 480 permissions.".to_string())
    }
}

#[tauri::command]
fn send_p2p_message(state: State<'_, SteamState>, target_id: String, msg_type: String, payload: String) -> Result<(), String> {
    let client_guard = state.client.lock().unwrap();
    if let Some(client) = client_guard.as_ref() {
        let sid = target_id.parse::<u64>().map_err(|_| "Invalid Steam ID format")?;
        let steam_id = SteamId::from_raw(sid);
        
        // Construct standard JSON frame
        let frame = P2PPayload {
            sender_id: client.user().steam_id().raw().to_string(),
            msg_type,
            data: payload
        };
        
        let json_bytes = serde_json::to_vec(&frame).map_err(|e| e.to_string())?;
        
        // Send via networking messages 
        // Note: we use send_p2p_packet in raw P2P, but steamworks-rs bindings wrap this
        let success = client.networking().send_p2p_packet(steam_id, steamworks::SendType::Reliable, &json_bytes);
        
        if success {
            Ok(())
        } else {
            Err("Failed to route P2P packet".to_string())
        }
    } else {
        Err("Steam not connected".to_string())
    }
}

#[tauri::command]
fn accept_p2p_session(state: State<'_, SteamState>, target_id: String) -> Result<(), String> {
    let client_guard = state.client.lock().unwrap();
    if let Some(client) = client_guard.as_ref() {
        let sid = target_id.parse::<u64>().map_err(|_| "Invalid Steam ID")?;
        client.networking().accept_p2p_session(SteamId::from_raw(sid));
        Ok(())
    } else {
        Err("Steam not initialized".to_string())
    }
}

#[tauri::command]
fn get_local_filenames() -> Vec<String> {
    let mut names = Vec::new();
    
    let home_path = match std::env::consts::OS {
        "windows" => std::env::var("USERPROFILE").unwrap_or_default(),
        _ => std::env::var("HOME").unwrap_or_default(),
    };

    if !home_path.is_empty() {
        let desktop = format!("{}/Desktop", home_path);
        let downloads = format!("{}/Downloads", home_path);
        let docs = format!("{}/Documents", home_path);

        for path in &[desktop, downloads, docs] {
            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    if let Ok(name) = entry.file_name().into_string() {
                        if !name.starts_with('.') && !name.starts_with("ini") {
                           names.push(name);
                        }
                    }
                }
            }
        }
    }
    
    // We don't want to crash React by sending 100,000 files. Give it ~20 juicy ones
    names.truncate(20);
    names
}

#[tauri::command]
fn shake_window(window: tauri::Window) {
    if let Ok(original) = window.outer_position() {
        std::thread::spawn(move || {
            let mut offset = 25; // More intense shake
            for i in 0..24 { // Longer duration
                let dx = if i % 2 == 0 { offset } else { -offset };
                let dy = if i % 3 == 0 { offset } else { -offset };
                let _ = window.set_position(tauri::PhysicalPosition::new(original.x + dx, original.y + dy));
                std::thread::sleep(std::time::Duration::from_millis(20)); // Faster jitter
                
                // Decay the shake intensity
                if i % 4 == 0 { offset -= 4; }
                if offset < 2 { offset = 2; }
            }
            // Return to dead center
            let _ = window.set_position(original);
        });
    }
}

#[tauri::command]
fn send_void_notification(app: AppHandle, title: String, body: String) {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .unwrap();
}
#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}
#[tauri::command]
async fn update_discord_presence(
    state: State<'_, DiscordState>,
    presence: DiscordPresence,
) -> Result<(), String> {
    let mut client_guard = state.client.lock().unwrap();
    
    if client_guard.is_none() {
        // Pull from environment or fallback to Master's ID for local dev
        let app_id = std::env::var("DISCORD_APP_ID").unwrap_or_else(|_| "1485031082238804118".to_string());
        let mut client = DiscordIpcClient::new(&app_id);
        
        client.connect().map_err(|e| format!("Failed to connect to Discord: {}", e))?;
        *client_guard = Some(client);
    }
    
    if let Some(client) = client_guard.as_mut() {
        let mut assets = activity::Assets::new()
            .large_image(&presence.large_image)
            .large_text(&presence.large_text);
            
        if !presence.small_image.is_empty() {
            assets = assets.small_image(&presence.small_image);
        }

        let mut act = activity::Activity::new()
            .state(&presence.state)
            .details(&presence.details)
            .assets(assets);
            
        if let Some(end) = presence.end_time {
           act = act.timestamps(activity::Timestamps::new().end(end));
        }

        client.set_activity(act)
            .map_err(|e| format!("Failed to set Discord activity: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
async fn send_discord_webhook(
    state: State<'_, HttpState>,
    webhook_url: String,
    content: String,
) -> Result<(), String> {
    let target_url = if webhook_url.is_empty() || webhook_url.contains("mock") {
        std::env::var("DISCORD_WEBHOOK_URL").unwrap_or_else(|_| webhook_url.clone())
    } else {
        webhook_url.clone()
    };

    let payload = serde_json::json!({
        "content": content,
        "username": "VOID_RELAY_BOT",
        "avatar_url": "https://i.imgur.com/8Q9Z5Ym.png"
    });

    state.client.post(&target_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut steam_client_ref = None;
    
    // Attempt to initialize Steam API with AppID 480 (Spacewar)
    let steam_client = match Client::init_app(480) {
        Ok((client, single)) => {
            println!("Steam API Initialized Successfully as AppID 480 (Spacewar)");
            steam_client_ref = Some(client.clone());
            
            // Background thread to poll callbacks AND incoming P2P packets
            let client_for_thread = client.clone();
            std::thread::spawn(move || {
                loop {
                    single.run_callbacks();
                    
                    // Poll for P2P messages
                    if let Some(size) = client_for_thread.networking().is_p2p_packet_available() {
                        let mut buffer = vec![0; size];
                        if let Some((_sender_id, msg_size)) = client_for_thread.networking().read_p2p_packet(&mut buffer) {
                            if let Ok(_payload) = serde_json::from_slice::<P2PPayload>(&buffer[..msg_size]) {
                                // We cannot easily trigger tauri app.emit from here without storing the AppHandle globally.
                                // Instead, we will bind the read loop in the setup block!
                            }
                        }
                    }
                    
                    std::thread::sleep(std::time::Duration::from_millis(10));
                }
            });
            Some(client)
        },
        Err(e) => {
            println!("Failed to initialize Steam API: {}", e);
            None
        }
    };

    tauri::Builder::default()
        .manage(SteamState {
            client: Mutex::new(steam_client),
        })
        .manage(DiscordState {
            client: Mutex::new(None),
        })
        .manage(HttpState {
            client: HttpClient::new(),
        })
        .invoke_handler(tauri::generate_handler![
            get_steam_name, 
            create_lobby, 
            send_p2p_message, 
            accept_p2p_session, 
            get_local_filenames, 
            shake_window,
            update_discord_presence,
            send_discord_webhook,
            send_void_notification,
            exit_app
        ])
        .plugin(tauri_plugin_notification::init())
        .setup(move |app| {
            // Setup Steamworks Callback for "GameLobbyJoinRequested"
            // This fires when a player accepts a Steam Overlay invite from their friend
            if let Some(client) = steam_client_ref {
                let app_handle = app.handle().clone();
                let client_for_cb = client.clone();
                
                // We leak the callback handle so it listens forever
                let _cb = Box::leak(Box::new(client.register_callback(move |val: GameLobbyJoinRequested| {
                    println!("Steam Invite Accepted for Lobby: {:?}", val.lobby_steam_id);
                    let ah = app_handle.clone();
                    let host_id_str = val.friend_steam_id.raw().to_string();
                    
                    // Automatically request to join that lobby block
                    client_for_cb.matchmaking().join_lobby(val.lobby_steam_id, move |result| {
                        match result {
                            Ok(joined_lobby_id) => {
                                println!("Successfully Joined Steam Lobby!");
                                // Emit to React to transition the UI out of the Title Screen
                                let payload = serde_json::json!({
                                    "lobby_id": joined_lobby_id.raw().to_string(),
                                    "host_id": host_id_str
                                });
                                let _ = ah.emit("lobby-joined", payload);
                            },
                            Err(e) => println!("Failed to join requested Steam lobby: {:?}", e),
                        }
                    });
                })));
                
                // Auto-accept P2P connections (NAT Punch hole)
                let _ah_p2p = app.handle().clone();
                let client_p2p = client.clone();
                let _p2p_req = Box::leak(Box::new(client.register_callback(move |req: P2PSessionRequest| {
                    println!("P2P Session Requested by: {:?}", req.remote);
                    client_p2p.networking().accept_p2p_session(req.remote);
                })));

                let _p2p_fail_client = client.clone();
                let p2p_fail_ah = app.handle().clone();
                let _p2p_fail = Box::leak(Box::new(client.register_callback(move |fail: P2PSessionConnectFail| {
                    println!("P2P Session Failed/Lost with: {:?}", fail.remote);
                    let _ = p2p_fail_ah.emit("p2p-disconnected", fail.remote.raw().to_string());
                })));

                // P2P Polling Loop bound to AppHandle
                let p2p_client_poller = client.clone();
                let p2p_ah = app.handle().clone();
                std::thread::spawn(move || {
                    loop {
                        while let Some(size) = p2p_client_poller.networking().is_p2p_packet_available() {
                            let mut buffer = vec![0; size];
                            if let Some((_sender_id, msg_size)) = p2p_client_poller.networking().read_p2p_packet(&mut buffer) {
                                if let Ok(payload) = serde_json::from_slice::<P2PPayload>(&buffer[..msg_size]) {
                                    let _ = p2p_ah.emit("p2p-message-received", payload);
                                }
                            }
                        }
                        std::thread::sleep(std::time::Duration::from_millis(20));
                    }
                });
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
