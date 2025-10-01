## 📋 List Mail Accounts
This command lists all email accounts associated with a specific domain.

### Interactive Usage
```bash
candy mail list
```
You will be prompted to enter the domain name (e.g., `example.com`) to see all its email accounts.

### Single-Line Usage with Prefixes
```bash
# Specify domain directly
candy mail list -d example.com

# Or use long form prefix
candy mail list --domain example.com
```

### Available Prefixes
- `-d`, `--domain`: Domain name to list email accounts for
