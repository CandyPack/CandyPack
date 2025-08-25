const dns = require('dns')
const net = require('net')
const tls = require('tls')
const fs = require('fs')
const DKIMSign = require('dkim-signer').DKIMSign

class smtp {
  #command(socket, command) {
    return new Promise(resolve => {
      socket.once('data', data => {
        const response = data.toString()
        return resolve(response)
      })
      if (socket.writable) socket.write(command)
    })
  }

  #connect(sender, host, port) {
    return new Promise(resolve => {
      let socket
      if (port == 465)
        socket = tls.connect({host: host, port: port, rejectUnauthorized: false}, async () => {
          socket.setEncoding('utf8')
          await new Promise(resolve => socket.once('data', resolve))
          await this.#command(socket, `EHLO ${sender}\r\n`)
          resolve(socket)
        })
      else
        socket = net.createConnection(port, host, async () => {
          socket.setEncoding('utf8')
          await new Promise(resolve => socket.once('data', resolve))
          let response = await this.#command(socket, `EHLO ${sender}\r\n`)
          if (!response.startsWith('2') || !response.includes('STARTTLS')) return resolve(socket)
          response = await this.#command(socket, `STARTTLS\r\n`)
          if (!response.startsWith('2')) return resolve(socket)
          socket.removeAllListeners()
          socket = tls.connect({socket: socket, servername: host, rejectUnauthorized: false, minVersion: 'TLSv1.2'}, async () => {
            socket.setEncoding('utf8')
            await new Promise(resolve => setTimeout(resolve, 1000))
            response = await this.#command(socket, `EHLO ${sender}\r\n`)
            resolve(socket)
          })
          socket.on('error', error => {
            console.error('Error connecting to the server (TLS):', error)
            return resolve(false)
          })
        })
      socket.on('error', error => {
        console.error('Error connecting to the server:', error)
        return resolve(false)
      })
    })
  }

  #content(obj) {
    let domain = obj.from.value[0].address.split('@')[1]
    let headers = obj.headerLines.map(header => `${header.line}`).join('\r\n')
    let content = ''
    if (obj.html.length || obj.attachments.length) {
      let boundary = headers.match(/boundary="(.*)"/)[1]
      if (obj.text.length)
        content += `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n${obj.text}\r\n`
      if (obj.html.length)
        content += `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n${obj.html}\r\n`
      for (let attachment of obj.attachments)
        content += `--${boundary}\r\nContent-Type: ${attachment.contentType}; name="${attachment.filename}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n${attachment.content.toString('base64')}\r\n`
      content += `--${boundary}--\r\n`
    } else content = obj.text
    if (content) content = content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
    let dkim = Candy.core('Config').config.websites[domain].cert?.dkim
    let signature = ''
    if (dkim) {
      signature = this.#dkim({
        header: headers,
        content: content,
        domain: obj.from.value[0].address.split('@')[1],
        private: fs.readFileSync(dkim.private, 'utf8'),
        selector: 'default'
      })
    }
    content = signature + '\r\n' + headers + '\r\n\r\n' + content + '\r\n'
    return content
  }

  #dkim(obj) {
    var options = {
      domainName: obj.domain,
      keySelector: obj.selector,
      privateKey: obj.private
    }
    return DKIMSign(obj.header + '\r\n\r\n' + obj.content, options)
  }

  #host(domain) {
    return new Promise((resolve, reject) => {
      dns.resolveMx(domain, (error, addresses) => {
        if (error) return reject(error)
        addresses.sort((a, b) => a.priority - b.priority)
        return resolve(addresses[0].exchange)
      })
    })
  }

  async #send(to, obj) {
    log('Mail', 'Sending email to ' + to)
    let host = await this.#host(to.split('@')[1])
    let sender = obj.from.value[0].address.split('@')[1]
    let socket = await this.#connect(sender, host, 25)
    if (!socket) socket = await this.#connect(sender, host, 587)
    if (!socket) socket = await this.#connect(sender, host, 465)
    if (!socket) socket = await this.#connect(sender, host, 2525)
    if (!socket) {
      log('Mail', 'Could not connect to the server')
      return
    }
    log('Mail', 'Connected to ' + host)
    let result = await this.#command(socket, `MAIL FROM:<${obj.from.value[0].address}>\r\n`)
    if (!result.startsWith('2')) {
      if (socket) socket.end()
      return log('Mail', 'Could not send the email to ' + to, result)
    }
    result = await this.#command(socket, `RCPT TO:<${to}>\r\n`)
    if (!result.startsWith('2')) {
      if (socket) socket.end()
      return log('Mail', 'Could not send the email to ' + to, result)
    }
    result = await this.#command(socket, `DATA\r\n`)
    if (!result.startsWith('2') && !result.startsWith('3')) {
      if (socket) socket.end()
      return log('Mail', 'Could not send the email to ' + to, result)
    }
    if (socket.writable) socket.write(this.#content(obj))
    result = await this.#command(socket, `.\r\n`)
    if (socket) socket.end()
    log('Mail', 'Email sent to ' + to)
  }

  async send(obj) {
    for (let to of obj.to.value) await this.#send(to.address, obj)
  }
}

module.exports = new smtp()
