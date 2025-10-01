## 🗑️ Delete a Subdomain

This command removes a subdomain configuration from your server.

### Interactive Usage
```bash
candy subdomain delete
```
You will be prompted to enter the full subdomain name (including the main domain) that you want to delete.

### Single-Line Usage with Prefixes
```bash
# Specify subdomain directly
candy subdomain delete -s blog.example.com

# Or use long form prefix
candy subdomain delete --subdomain blog.example.com
```

### Available Prefixes
- `-s`, `--subdomain`: Full subdomain name to delete (e.g., blog.example.com)

### Interactive Example
```bash
$ candy subdomain delete
> Enter the subdomain name (subdomain.example.com): blog.example.com
✓ Subdomain 'blog.example.com' deleted successfully
```

### Single-Line Example
```bash
$ candy subdomain delete -s blog.example.com
✓ Subdomain 'blog.example.com' deleted successfully
```

### Important Notes
- This command only removes the server configuration for the subdomain
- It **does not** delete the subdomain's directory or files
- If you want to remove the files as well, you must delete the directory manually
- The subdomain will no longer be accessible after deletion
- SSL certificates associated with the subdomain may need to be renewed for the main domain