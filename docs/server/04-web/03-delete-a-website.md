## 🗑️ Delete a Website

You can delete a website using the `web delete` command. This command will prompt you for the domain name of the website you want to delete.

```bash
candy web delete
```

The command will then ask for the domain name:
```
Enter the domain name: my-website.com
```

### Important Note

This command only removes the server configuration for the website. It **does not** delete the website's source code directory. If you want to remove the source code as well, you must delete the directory manually.
