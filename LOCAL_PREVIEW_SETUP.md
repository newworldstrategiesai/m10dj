# 🖥️ Local Preview Setup for Marketing Sites

## Quick Setup (Recommended)

### Step 1: Edit Your Hosts File

Add these entries to your `/etc/hosts` file to map the domains to localhost:

```bash
sudo nano /etc/hosts
```

Add these lines at the bottom:
```
127.0.0.1    tipjar.live
127.0.0.1    www.tipjar.live
127.0.0.1    djdash.net
127.0.0.1    www.djdash.net
```

**On macOS/Linux:**
```bash
echo "127.0.0.1    tipjar.live" | sudo tee -a /etc/hosts
echo "127.0.0.1    www.tipjar.live" | sudo tee -a /etc/hosts
echo "127.0.0.1    djdash.net" | sudo tee -a /etc/hosts
echo "127.0.0.1    www.djdash.net" | sudo tee -a /etc/hosts
```

### Step 2: Start Your Dev Server

```bash
npm run dev
```

### Step 3: Access the Sites

Open your browser and visit:
- **TipJar**: http://tipjar.live:3002 (or whatever port Next.js assigns)
- **DJ Dash**: http://djdash.net:3002
- **M10 DJ Company**: http://localhost:3002

---

## Alternative: Direct Route Access (No Hosts File)

If you don't want to modify your hosts file, you can access the routes directly:

- **TipJar**: http://localhost:3002/tipjar
- **DJ Dash**: http://localhost:3002/djdash
- **M10 DJ Company**: http://localhost:3002

**Note:** This method bypasses the middleware hostname check, so it may not fully test the domain routing logic.

---

## Testing in Cursor Browser

Cursor's browser should respect your hosts file. If it doesn't:

1. **Use the direct route method** above
2. **Or use a regular browser** (Chrome, Firefox, Safari) which will respect the hosts file

---

## Verify It's Working

After setting up, you should see:
- `tipjar.live:3002` → TipJar homepage (green/purple gradient)
- `djdash.net:3002` → DJ Dash homepage (blue gradient, "DJ Booking Software" headline)
- `localhost:3002` → M10 DJ Company homepage (Memphis DJ services)

---

## Troubleshooting

### Hosts file not working?
1. Make sure you saved the file correctly
2. Flush DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```
3. Try accessing with `http://` explicitly (not `https://`)

### Port issues?
- Check what port Next.js is using (it will show in the terminal)
- Use that port number instead of 3002

### Still seeing wrong page?
- Clear your browser cache
- Try incognito/private mode
- Check that the middleware is running (check terminal for middleware logs)

---

## Quick Test Script

Run this to quickly add/remove the hosts entries:

```bash
# Add entries
./scripts/add-localhost-domains.sh

# Remove entries (when done testing)
./scripts/remove-localhost-domains.sh
```






