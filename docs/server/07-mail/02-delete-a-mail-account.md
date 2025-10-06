## 🗑️ Delete a Mail Account
This command removes an existing email account.

### Interactive Usage
```bash
candy mail delete
```
You will be prompted to enter the email address you wish to delete.

### Single-Line Usage with Prefixes
```bash
# Specify email directly
candy mail delete -e user@example.com

# Or use long form prefix
candy mail delete --email user@example.com
```

### Available Prefixes
- `-e`, `--email`: Email address to delete
