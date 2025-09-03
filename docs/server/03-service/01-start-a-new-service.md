## ⚙️ Start a New Service

To start a new service, use the `run` command followed by the path to your application's entry file.

### Usage
```bash
candy run <file>
```

### Arguments
- `<file>`: The path to the script or application entry point you want to run. This can be an absolute path or a relative path from your current directory.

### Example
If you have a Node.js application with an `index.js` file, you can start it as a service like this:
```bash
candy run /path/to/your/app/index.js
```
or from within the app's directory:
```bash
candy run index.js
```

Once started, CandyPack will monitor the service and automatically restart it if it crashes. You can view its status using the `monit` command.
