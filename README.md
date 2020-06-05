# Email viewer

This is a little email viewer demo project. Its not entirely styled, but its useful enough to be able to open and view emails in an email archive. It supports:

- Text and HTML emails
- Downloading attachments
- GMail labels
- Threading
- Full character encoding support
- Mailboxes in the mbox-rd format (used by Google Takeout)
- Individual email files. (You can select multiple email files to see them all)

The entire email viewer is implemented the browser. Your emails are never sent to another computer.

It does not support:

- Full text search
- Huge mailboxes (it seems to choke up after about 1gb of data)
- Image redirection (tracking images will track you)

Internally the library uses [mime-to-jmap](https://github.com/josephg/mime-to-jmap) to parse emails via some code extracted from the [cyrus imap server](https://github.com/cyrusimap/cyrus-imapd/) used at [Fastmail](https://www.fastmail.com/).

I've mostly been testing this code with a corpus from google takeout. There are probably bugs when importing data from other systems.

Please file issues if you run into problems.


## License

Code published under the MIT license. See LICENSE file.