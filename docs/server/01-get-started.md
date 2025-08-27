# Get Started with CandyPack

This guide will walk you through the process of setting up the CandyPack server.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: Version 18.0.0 or higher.

## Installation

You can install CandyPack using either the quick or manual installation method.

### Quick Install (Recommended)

For a fast and automated setup on Linux, macOS, or Windows, run the following command in your terminal:

```bash
curl -sL https://candypack.dev/install | bash
```

This command will automatically handle the installation of Node.js if it's missing, install CandyPack globally, and prepare your system for use.

### Manual Installation

For more control over the installation process, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CandyPack/CandyPack.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd CandyPack
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Server

CandyPack is designed to run as a persistent background service.

- **Starting the Server:** The server process starts automatically the first time you run any `candy` command. To check the status, simply run:
  ```bash
  candy
  ```

- **Restarting the Server:** If you need to restart the server, use the `restart` command:
  ```bash
  candy restart
  ```

- **Monitoring:** You can monitor your websites and services in real-time with the `monit` command:
  ```bash
  candy monit
  ```

- **Viewing Logs:** To debug the server and view live logs, use the `debug` command:
  ```bash
  candy debug
  ```
