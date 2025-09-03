## 🗑️ Delete a Website

You can delete a website using the `web:delete` command. This command will remove the website from the server configuration, but it will not delete the website's source code files.

```bash
candypack web:delete my-website.com
```

### Important Note

This command only removes the server configuration for the website. It **does not** delete the website's source code directory. If you want to remove the source code as well, you must delete the directory manually.
