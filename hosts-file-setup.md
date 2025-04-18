# Setting Up Custom Domains Using Hosts File

For local development with custom domains like `scaleup-admin.local`, you need to configure your system's hosts file to map these domains to your local IP address.

## Why Use Custom Domains?

- Allows sharing cookies between subdomains (`.local` domain)
- Better simulates production environment
- Required for proper cross-domain authentication
- More realistic testing environment

## Editing Your Hosts File

### On Windows

1. Open Notepad as Administrator:
   - Search for Notepad
   - Right-click on Notepad and select "Run as administrator"

2. Open the hosts file:
   - File > Open
   - Navigate to: `C:\Windows\System32\drivers\etc\`
   - Change the file filter from "Text Documents (*.txt)" to "All Files (*.*)"
   - Select the file named `hosts`

3. Add the following lines at the end of the file:
   ```
   127.0.0.1 scaleup-admin.local
   127.0.0.1 scaleup-api.local
   ```

4. Save the file

### On macOS

1. Open Terminal

2. Edit the hosts file using sudo:
   ```bash
   sudo nano /etc/hosts
   ```

3. Enter your password when prompted

4. Add the following lines at the end of the file:
   ```
   127.0.0.1 scaleup-admin.local
   127.0.0.1 scaleup-api.local
   ```

5. Save the file:
   - Press `Ctrl+O` to write the file
   - Press `Enter` to confirm
   - Press `Ctrl+X` to exit

### On Linux

1. Open Terminal

2. Edit the hosts file using sudo:
   ```bash
   sudo nano /etc/hosts
   ```

3. Enter your password when prompted

4. Add the following lines at the end of the file:
   ```
   127.0.0.1 scaleup-admin.local
   127.0.0.1 scaleup-api.local
   ```

5. Save the file:
   - Press `Ctrl+O` to write the file
   - Press `Enter` to confirm
   - Press `Ctrl+X` to exit

## Verifying Your Setup

1. Flush your DNS cache:

   **Windows:**
   ```
   ipconfig /flushdns
   ```

   **macOS:**
   ```
   sudo killall -HUP mDNSResponder
   ```

   **Linux (Ubuntu/Debian):**
   ```
   sudo systemd-resolve --flush-caches
   ```

2. Test the domain with ping:
   ```
   ping scaleup-admin.local
   ```
   
   It should respond with `127.0.0.1`.

## Troubleshooting

- **"Permission denied" when saving:** Make sure you're running the text editor as administrator/with sudo.
  
- **Changes not taking effect:** Try flushing your DNS cache and restarting your browser.
  
- **Domain not resolving:** Check for typos in your hosts file. Make sure there are no extra spaces or characters.
  
- **Browser trying to search instead of navigating to domain:** Make sure to include the protocol (e.g., `https://scaleup-admin.local` instead of just `scaleup-admin.local`).

- **Chrome ignoring hosts file for .local domains:** Chrome sometimes forces HTTPS for certain TLDs including .local. Make sure you're using HTTPS with your custom domains. 