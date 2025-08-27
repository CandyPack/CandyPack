# Managing Subdomains 🔗

CandyPack makes it easy to manage subdomains for your main websites. The `subdomain` command is used for all subdomain-related tasks.

## Create a Subdomain
This command allows you to create a new subdomain. CandyPack will automatically configure it to point to a directory with the same name inside your main domain's root directory.

### Usage
```bash
candy subdomain create
```
After running the command, you will be prompted to enter the new subdomain name, including the main domain (e.g., `blog.example.com`).

### Example
```bash
$ candy subdomain create
> Enter the subdomain name (subdomain.example.com): blog.example.com
```

## List Subdomains
To see a list of all subdomains configured for a specific domain, use the `list` command.

### Usage
```bash
candy subdomain list
```
This command will prompt you to enter the main domain name for which you want to list the subdomains.

### Example
```bash
$ candy subdomain list
> Enter the domain name: example.com
```

This will display a list of all subdomains associated with `example.com`.
