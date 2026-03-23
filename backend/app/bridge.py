import serial
import httpx
import time

# --- CONFIGURATION (Change these to match your setup) ---
SERIAL_PORT = "/dev/tty.usbserial-0001"    # Change to COM3, COM4 on Windows
baud_rate = 9600                           # Hardware baud rate
BACKEND_URL = "http://localhost:8000"      # Use the IP address of the backend PC if it's on a different computer (e.g., http://192.168.1.10:8000)

def parse_incoming_data(raw_text):
    """
    Modify this function to correctly split your hardware's actual map output.
    Assume the hardware prints: "WATCH-A 28.5 77.5 90"
    """
    try:
        parts = raw_text.strip().split() # Adjust splitting logic based on what the hardware outputs
        return {
            "device_id": parts[0],
            "latitude": float(parts[1]),
            "longitude": float(parts[2]),
            "battery": int(parts[3]) if len(parts) > 3 else None,
        }
    except Exception as e:
        print(f"Failed to parse data '{raw_text}': {e}")
        return None

def main():
    print(f"📡 Opening serial port {SERIAL_PORT}...")
    try:
        with serial.Serial(SERIAL_PORT, baud_rate, timeout=1) as ser:
            while True:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    print(f"Received raw data from LoRa: {line}")
                    
                    # Convert raw serial text to JSON format
                    payload = parse_incoming_data(line)
                    
                    if payload:
                        # Send the JSON payload to our FastAPI backend!
                        try:
                            res = httpx.post(f"{BACKEND_URL}/api/sos/signal", json=payload)
                            print(f"✅ Sent to Backend successfully! Response: {res.status_code}")
                            print(f"Server replied: {res.json()}")
                        except Exception as e:
                            print(f"❌ Failed to reach backend: {e}")
    except serial.SerialException as e:
        print(f"Serial port error: {e}")

if __name__ == "__main__":
    main()
