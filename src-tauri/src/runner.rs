use crate::models::Environment;
use ssh2::Session;
use std::io::Read;
use std::net::TcpStream;
use std::process::Command;

pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
}

pub fn execute_docker(
    args: &[&str],
    env: &Environment,
    current_dir: Option<&str>,
) -> Result<CommandResult, String> {
    match env {
        Environment::Local => {
            let mut cmd = Command::new("docker");
            cmd.args(args);
            if let Some(dir) = current_dir {
                cmd.current_dir(dir);
            }
            let output = cmd.output().map_err(|e| e.to_string())?;

            Ok(CommandResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
                success: output.status.success(),
            })
        }
        Environment::Ssh {
            host,
            port,
            username,
            password,
            ..
        } => {
            // Setup SSH connection
            let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
            let mut sess = Session::new().map_err(|e| e.to_string())?;
            sess.set_tcp_stream(tcp);
            sess.handshake().map_err(|e| e.to_string())?;

            // Authenticate
            if let Some(pass) = password {
                sess.userauth_password(username, pass).map_err(|e| e.to_string())?;
            } else {
                return Err("SSH key authentication is not yet supported".to_string());
            }

            if !sess.authenticated() {
                return Err("SSH Authentication failed".to_string());
            }

            let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
            
            // Build the command line string
            let mut cmd_str = String::from("docker");
            for arg in args {
                // simple escaping for SSH command line
                let escaped_arg = arg.replace("'", "'\\''");
                cmd_str.push_str(&format!(" '{}'", escaped_arg));
            }

            // Handle current_dir by prefixing the command with `cd dir &&`
            if let Some(dir) = current_dir {
                let escaped_dir = dir.replace("'", "'\\''");
                cmd_str = format!("cd '{}' && {}", escaped_dir, cmd_str);
            }

            channel.exec(&cmd_str).map_err(|e| e.to_string())?;

            let mut stdout = String::new();
            channel.read_to_string(&mut stdout).map_err(|e| e.to_string())?;

            let mut stderr = String::new();
            channel.stderr().read_to_string(&mut stderr).map_err(|e| e.to_string())?;

            channel.wait_close().map_err(|e| e.to_string())?;
            let exit_status = channel.exit_status().map_err(|e| e.to_string())?;

            Ok(CommandResult {
                stdout,
                stderr: stderr.trim().to_string(),
                success: exit_status == 0,
            })
        }
    }
}
